// Learning blocks configuration version (increment when structure changes)
const BLOCKS_VERSION = 2;

// Default fallback blocks (used only if leerdoelen.json can't be loaded)
const LEARNING_BLOCKS = [
    {
        id: 1,
        title: "Leerdoel 1",
        description: "Voorbeeld leerdoel (fallback)",
        objectives: [
            {
                id: 1,
                text: "Voorbeeld leerdoel",
                keywords: ["voorbeeld", "leerdoel"],
                completed: false
            }
        ],
        locked: false
    }
];

class TTSPlayer {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.voice = options.defaultVoice || 'alloy';
        this.activeSession = null;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    hasApiKey() {
        return Boolean(this.apiKey);
    }

    setVoice(voice) {
        this.voice = voice;
    }

    stop() {
        if (this.activeSession) {
            try {
                this.activeSession.audio.pause();
            } catch (error) {
                console.warn('Kon audio niet pauzeren', error);
            }
            this.activeSession.cleanup();
            this.activeSession = null;
        }
    }

    async playText(text) {
        if (!this.hasApiKey()) {
            throw new Error('OpenAI API sleutel ontbreekt. Voeg deze toe in settings.js.');
        }

        this.stop();

        const session = await this.createStreamingSession(text);
        this.activeSession = session;

        try {
            const audio = await session.ready;
            await audio.play();

            const handlePlaybackFinished = () => {
                if (this.activeSession === session) {
                    this.activeSession = null;
                }
                session.cleanup();
            };

            audio.addEventListener('ended', handlePlaybackFinished, { once: true });
            audio.addEventListener('pause', () => {
                if (audio.currentTime < audio.duration) {
                    handlePlaybackFinished();
                }
            }, { once: true });

            return audio;
        } catch (error) {
            session.cleanup();
            if (this.activeSession === session) {
                this.activeSession = null;
            }
            throw error;
        }
    }

    async createStreamingSession(text) {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-tts',
                voice: this.voice,
                input: text,
                format: 'mpeg'
            })
        });

        if (!response.ok) {
            let errorMessage = 'Text-to-speech verzoek mislukt.';
            try {
                const errorData = await response.json();
                if (errorData?.error?.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (parseError) {
                console.warn('Kon foutbericht niet lezen', parseError);
            }
            throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Streaming wordt niet ondersteund in deze browser.');
        }

        const audio = new Audio();
        audio.preload = 'auto';

        const mediaSource = new MediaSource();
        const objectUrl = URL.createObjectURL(mediaSource);
        audio.src = objectUrl;

        let cleanupCalled = false;
        let sourceBuffer;
        let updateHandler;

        const cleanup = () => {
            if (cleanupCalled) return;
            cleanupCalled = true;

            try {
                reader.cancel().catch(() => {});
            } catch (error) {
                console.warn('Kon reader niet annuleren', error);
            }

            if (sourceBuffer && updateHandler) {
                try {
                    sourceBuffer.removeEventListener('updateend', updateHandler);
                } catch (error) {
                    console.warn('Kon update listener niet verwijderen', error);
                }
            }

            try {
                mediaSource.endOfStream();
            } catch (_) {
                // Ignored - kan voorkomen als de stream al beëindigd is
            }

            try {
                audio.pause();
            } catch (_) {}

            try {
                audio.removeAttribute('src');
                audio.load();
            } catch (_) {}

            try {
                URL.revokeObjectURL(objectUrl);
            } catch (error) {
                console.warn('Kon object URL niet vrijgeven', error);
            }
        };

        const ready = new Promise((resolve, reject) => {
            mediaSource.addEventListener('sourceopen', () => {
                try {
                    sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                } catch (error) {
                    reject(error);
                    return;
                }

                const queue = [];
                let isEnded = false;
                let firstChunkResolved = false;

                updateHandler = () => {
                    if (!sourceBuffer || sourceBuffer.updating) {
                        return;
                    }

                    if (queue.length > 0) {
                        const chunk = queue.shift();
                        try {
                            sourceBuffer.appendBuffer(chunk);
                        } catch (error) {
                            reject(error);
                        }
                    } else if (isEnded) {
                        try {
                            mediaSource.endOfStream();
                        } catch (_) {}
                    }
                };

                sourceBuffer.addEventListener('updateend', updateHandler);

                const pump = async () => {
                    try {
                        while (true) {
                            const { value, done } = await reader.read();

                            if (done) {
                                isEnded = true;
                                updateHandler();
                                if (!firstChunkResolved) {
                                    firstChunkResolved = true;
                                    resolve(audio);
                                }
                                break;
                            }

                            const chunk = value.buffer.slice(
                                value.byteOffset,
                                value.byteOffset + value.byteLength
                            );
                            queue.push(chunk);
                            updateHandler();

                            if (!firstChunkResolved) {
                                firstChunkResolved = true;
                                resolve(audio);
                            }
                        }
                    } catch (error) {
                        reject(error);
                    }
                };

                pump();
            }, { once: true });

            mediaSource.addEventListener('error', () => {
                reject(new Error('Er trad een fout op bij het verwerken van de audiostream.'));
            }, { once: true });
        });

        return { audio, ready, cleanup };
    }
}

class ChatInterface {
    constructor() {
        this.messages = [];
        this.isProcessing = false;

    // Will be loaded asynchronously from leerdoelen.json
    this.learningBlocks = [];
        this.currentBlock = null;

        this.systemPrompt = '';
        this.initialUserPrompt = '';

        this.settings = window.APP_SETTINGS || {};
        this.availableVoices = [
            { value: 'alloy', label: 'Alloy' },
            { value: 'verse', label: 'Verse' },
            { value: 'sol', label: 'Sol' },
            { value: 'luna', label: 'Luna' },
            { value: 'ember', label: 'Ember' }
        ];

        this.ttsPlayer = new TTSPlayer(this.settings.OPENAI_API_KEY || '', {
            defaultVoice: this.settings.DEFAULT_TTS_VOICE || 'alloy'
        });
        this.selectedVoice = this.ttsPlayer.voice;
        this.currentTtsButton = null;

        this.elements = {
            startPage: document.getElementById('startPage'),
            blocksContainer: document.getElementById('blocksContainer'),
            chatContainer: document.getElementById('chatContainer'),
            messagesDiv: document.getElementById('messages'),
            userInput: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            status: document.getElementById('status'),
            backBtn: document.getElementById('backBtn'),
            voiceSelect: document.getElementById('voiceSelect')
        };
        
        this.init();
    }
    
    async loadLearningBlocks() {
        // Always try to load from leerdoelen.json and then merge with saved progress
        const saved = localStorage.getItem('learningBlocks');
        const savedVersion = localStorage.getItem('blocksVersion');
        let savedBlocks = null;
        if (saved && saved !== 'undefined' && savedVersion === String(BLOCKS_VERSION)) {
            try {
                savedBlocks = JSON.parse(saved);
            } catch (e) {
                console.warn('Kon opgeslagen voortgang niet lezen, wordt genegeerd', e);
            }
        }

        let blocksFromJson = null;
        try {
            const resp = await fetch('leerdoelen.json');
            if (resp.ok) {
                const data = await resp.json();
                const doelen = Array.isArray(data?.leerdoelen) ? data.leerdoelen : [];
                blocksFromJson = this.buildBlocksFromLeerdoelen(doelen);
            } else {
                console.warn('Kon leerdoelen.json niet laden, status:', resp.status);
            }
        } catch (err) {
            console.warn('Fout bij laden van leerdoelen.json:', err);
        }

        let blocks = blocksFromJson || JSON.parse(JSON.stringify(LEARNING_BLOCKS));

        // Merge saved completion/locked state by id if available
        if (savedBlocks && Array.isArray(savedBlocks)) {
            const map = new Map(savedBlocks.map(b => [b.id, b]));
            blocks = blocks.map((b, idx) => {
                const savedB = map.get(b.id);
                if (!savedB) return b;
                // merge objectives completion by id
                if (Array.isArray(b.objectives) && Array.isArray(savedB.objectives)) {
                    const objMap = new Map(savedB.objectives.map(o => [o.id, o]));
                    b.objectives = b.objectives.map(o => {
                        const so = objMap.get(o.id);
                        return so ? { ...o, completed: !!so.completed } : o;
                    });
                }
                // keep locked state from saved if present
                if (typeof savedB.locked === 'boolean') {
                    b.locked = savedB.locked;
                }
                return b;
            });
        }

        this.learningBlocks = blocks;
        this.saveLearningBlocks();
        return blocks;
    }

    buildBlocksFromLeerdoelen(doelen) {
        // Create one block per leerdoel with the description as the single objective
        const stopwords = new Set([
            'de','het','een','en','van','voor','met','op','in','zoals','bij','het','de','te','om','kan','kunnen','heeft','hebben','wordt','worden','zoals','deze','dit','die','dat','ai','modellen','model','gebruik','gebruiken'
        ]);
        const blocks = doelen
            .filter(d => d && (typeof d.id === 'number' || typeof d.id === 'string') && d.beschrijving)
            .map((d, idx) => {
                const idNum = Number(d.id);
                const title = `Leerdoel ${isNaN(idNum) ? String(d.id) : idNum}`;
                const text = String(d.beschrijving).trim();
                // naive keyword extraction
                const keywords = Array.from(new Set(
                    text
                        .toLowerCase()
                        .replace(/[^a-zà-ž0-9\s]/gi, ' ')
                        .split(/\s+/)
                        .filter(w => w && w.length >= 3 && !stopwords.has(w))
                )).slice(0, 8);
                return {
                    id: isNaN(idNum) ? idx + 1 : idNum,
                    title,
                    description: text,
                    objectives: [
                        {
                            id: isNaN(idNum) ? idx + 1 : idNum,
                            text,
                            keywords,
                            completed: false
                        }
                    ],
                    locked: idx !== 0 // only first unlocked
                };
            });

        // ensure at least one block exists
        if (blocks.length === 0) {
            return JSON.parse(JSON.stringify(LEARNING_BLOCKS));
        }
        return blocks;
    }
    
    saveLearningBlocks() {
        localStorage.setItem('learningBlocks', JSON.stringify(this.learningBlocks));
        localStorage.setItem('blocksVersion', String(BLOCKS_VERSION));
    }
    
    async init() {
        await this.loadPrompts();
        await this.loadLearningBlocks();
        this.setupVoiceSelection();
        this.renderStartPage();
        this.attachEventListeners();
    }

    setupVoiceSelection() {
        if (!this.elements.voiceSelect) {
            return;
        }

        this.elements.voiceSelect.innerHTML = '';

        this.availableVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.value;
            option.textContent = voice.label;
            this.elements.voiceSelect.appendChild(option);
        });

        const hasDefaultVoice = this.availableVoices.some(voice => voice.value === this.selectedVoice);

        if (hasDefaultVoice) {
            this.elements.voiceSelect.value = this.selectedVoice;
        } else if (this.availableVoices.length > 0) {
            this.selectedVoice = this.availableVoices[0].value;
            this.elements.voiceSelect.value = this.selectedVoice;
            this.ttsPlayer.setVoice(this.selectedVoice);
        }

        this.elements.voiceSelect.addEventListener('change', (event) => {
            this.selectedVoice = event.target.value;
            this.ttsPlayer.setVoice(this.selectedVoice);

            if (this.currentTtsButton) {
                this.resetTtsButton(this.currentTtsButton);
                this.currentTtsButton = null;
            }

            this.ttsPlayer.stop();
        });
    }

    renderStartPage() {
        this.elements.startPage.classList.remove('hidden');
        this.elements.chatContainer.classList.add('hidden');

        this.elements.blocksContainer.innerHTML = '';
        
        this.learningBlocks.forEach(block => {
            const blockEl = this.createBlockElement(block);
            this.elements.blocksContainer.appendChild(blockEl);
        });
    }
    
    createBlockElement(block) {
        const blockDiv = document.createElement('div');
        blockDiv.className = `block ${block.locked ? 'locked' : ''}`;
        
        const completedObjectives = block.objectives.filter(o => o.completed).length;
        const totalObjectives = block.objectives.length;
        const progress = (completedObjectives / totalObjectives) * 100;
        
        blockDiv.innerHTML = `
            <div class="block-header">
                <h2>${block.title}</h2>
                ${block.locked ? '<span class="lock-icon">🔒</span>' : ''}
            </div>
            <p class="block-description">${block.description}</p>
            <div class="objectives">
                <h3>Leerdoelen:</h3>
                <ul>
                    ${block.objectives.map(obj => `
                        <li class="${obj.completed ? 'completed' : ''}">
                            ${obj.completed ? '✅' : '⭕'} ${obj.text}
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${completedObjectives}/${totalObjectives} leerdoelen behaald</div>
            ${!block.locked ? `<button class="start-block-btn" data-block-id="${block.id}">Start Blok</button>` : '<p class="locked-message">Voltooi het vorige blok om dit te ontgrendelen</p>'}
        `;
        
        const startBtn = blockDiv.querySelector('.start-block-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startBlock(block));
        }
        
        return blockDiv;
    }
    
    startBlock(block) {
        this.currentBlock = block;
        this.elements.startPage.classList.add('hidden');
        this.showChat();
        
        // Add system message about the block
        const systemMessage = `Je bent nu bezig met ${block.title}. De volgende leerdoelen moet je behalen:\n\n${block.objectives.filter(o => !o.completed).map(o => `- ${o.text}`).join('\n')}\n\nStel vragen over deze onderwerpen en ik help je om ze te begrijpen!`;
        
        this.messages = [{
            role: 'system',
            content: `Je bent een vriendelijke leraar die studenten helpt met programmeren. De student werkt aan "${block.title}". Begeleid de student door de leerdoelen: ${block.objectives.map(o => o.text).join(', ')}. Geef uitleg, voorbeelden en stel vragen om te controleren of de student het begrijpt. Als de student een onderwerp goed begrijpt en kan toepassen, geef dan duidelijk aan dat het leerdoel is behaald.`
        }];
        
        // Clear previous messages from UI
        this.elements.messagesDiv.innerHTML = '';
        this.addMessage('assistant', systemMessage);
    }
    
    async loadPrompts() {
        try {
            // Load system prompt from text file
            const systemResponse = await fetch('system_prompt.txt');
            if (systemResponse.ok) {
                this.systemPrompt = await systemResponse.text();
                this.messages.push({
                    role: 'system',
                    content: this.systemPrompt.trim()
                });
            } else {
                console.warn('system_prompt.txt not found, AI will use default behavior without system prompt');
            }
            
            // Load initial user prompt from text file
            const userResponse = await fetch('user_prompt.txt');
            if (userResponse.ok) {
                this.initialUserPrompt = await userResponse.text();
                // Update the initial assistant message in the DOM
                const initialMessage = document.querySelector('.message.assistant-message .message-content');
                if (initialMessage) {
                    initialMessage.textContent = this.initialUserPrompt.trim();
                }
            } else {
                console.warn('user_prompt.txt not found, using hardcoded initial message from HTML');
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
            // Fallback to default behavior: no system prompt and hardcoded HTML message
        }
    }
    
    attachEventListeners() {
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.elements.userInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.goBackToStart());
        }
    }
    
    showChat() {
        this.elements.chatContainer.classList.remove('hidden');
    }
    
    goBackToStart() {
        this.elements.chatContainer.classList.add('hidden');
        this.currentBlock = null;
        this.renderStartPage();
    }
    
    autoResizeTextarea() {
        const textarea = this.elements.userInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const content = this.elements.userInput.value.trim();
        
        if (!content || this.isProcessing) {
            return;
        }
        
        this.elements.userInput.value = '';
        this.autoResizeTextarea();
        
        this.addMessage('user', content);
        
        this.messages.push({
            role: 'user',
            content: content
        });
        
        await this.getAIResponse();
    }
    
    convertMarkdownToHtml(markdown) {
        let html = markdown;
        
        // Code blocks (``` ... ```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code (` ... `)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold (**text** or __text__)
        html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        
        // Italic (*text* or _text_)
        html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Unordered lists
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraph if not already wrapped in block element
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Convert markdown to HTML for assistant messages
        if (role === 'assistant') {
            contentDiv.innerHTML = this.convertMarkdownToHtml(content);
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(contentDiv);

        if (role === 'assistant') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            const ttsButton = document.createElement('button');
            ttsButton.type = 'button';
            ttsButton.className = 'tts-button';
            ttsButton.textContent = '🔊 Voorlezen';
            ttsButton.dataset.state = 'idle';
            ttsButton.setAttribute('aria-label', 'Voorlezen met text-to-speech');
            ttsButton.addEventListener('click', () => this.handleTextToSpeech(content, ttsButton));

            actionsDiv.appendChild(ttsButton);
            messageDiv.appendChild(actionsDiv);
        }

        this.elements.messagesDiv.appendChild(messageDiv);

        this.scrollToBottom();
    }

    async handleTextToSpeech(content, button) {
        if (!button) {
            return;
        }

        if (button.dataset.state === 'playing') {
            this.ttsPlayer.stop();
            this.resetTtsButton(button);
            this.currentTtsButton = null;
            return;
        }

        const plainText = this.getPlainTextForSpeech(content);

        if (!plainText) {
            this.showTtsError(new Error('Bericht bevat geen voorleesbare tekst om voor te lezen.'));
            return;
        }

        if (!this.ttsPlayer.hasApiKey()) {
            this.showTtsError(new Error('OpenAI API sleutel ontbreekt. Vul deze in via settings.js.'));
            return;
        }

        if (this.currentTtsButton && this.currentTtsButton !== button) {
            this.resetTtsButton(this.currentTtsButton);
        }

        this.ttsPlayer.stop();
        this.currentTtsButton = button;

        const originalLabel = button.textContent;
        button.dataset.originalLabel = originalLabel;
        button.dataset.state = 'loading';
        button.disabled = true;
        button.textContent = '⏳ Bezig...';

        try {
            this.ttsPlayer.setVoice(this.selectedVoice);
            const audio = await this.ttsPlayer.playText(plainText);

            button.disabled = false;
            button.dataset.state = 'playing';
            button.textContent = '⏹️ Stop';

            const reset = () => {
                if (this.currentTtsButton === button) {
                    this.currentTtsButton = null;
                }
                this.resetTtsButton(button);
            };

            audio.addEventListener('ended', reset, { once: true });
            audio.addEventListener('pause', () => {
                if (audio.currentTime < audio.duration) {
                    reset();
                }
            }, { once: true });
        } catch (error) {
            this.showTtsError(error);
            this.resetTtsButton(button);
            this.currentTtsButton = null;
        }
    }

    resetTtsButton(button) {
        if (!button) {
            return;
        }

        const originalLabel = button.dataset.originalLabel || '🔊 Voorlezen';
        button.disabled = false;
        button.textContent = originalLabel;
        button.dataset.state = 'idle';
        delete button.dataset.originalLabel;
    }

    showTtsError(error) {
        const messageText = error?.message || 'Er ging iets mis bij het afspelen van de spraak.';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `
            <div class="message-content">
                <strong>Spraak fout:</strong> ${this.escapeHtml(messageText)}
            </div>
        `;
        this.elements.messagesDiv.appendChild(errorDiv);
        this.scrollToBottom();
    }

    getPlainTextForSpeech(content) {
        if (!content) {
            return '';
        }

        let text = String(content);

        text = text.replace(/```[\s\S]*?```/g, ' ');
        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
        text = text.replace(/^\s*[-*+]\s+/gm, '');
        text = text.replace(/[>#*_~]/g, '');
        text = text.replace(/\s+/g, ' ');

        return text.trim();
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message';
        typingDiv.id = 'typing-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content typing-indicator';
        contentDiv.innerHTML = '<span></span><span></span><span></span>';
        
        typingDiv.appendChild(contentDiv);
        this.elements.messagesDiv.appendChild(typingDiv);
        
        this.scrollToBottom();
    }
    
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async getAIResponse() {
        this.isProcessing = true;
        this.elements.sendBtn.disabled = true;
        this.elements.status.textContent = 'Aan het typen...';
        this.elements.status.classList.add('loading');
        
        this.addTypingIndicator();
        
        try {
            // Using HTTP for localhost - local LLM servers typically don't use HTTPS
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                mode: 'cors', // Explicitly set CORS mode
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: this.messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    // Some local LLM servers may require a model parameter
                    // If your server requires it, uncomment and specify your model:
                    // model: 'your-model-name'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API fout: ${response.status}`);
            }
            
            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            
            this.messages.push({
                role: 'assistant',
                content: assistantMessage
            });
            
            this.removeTypingIndicator();
            this.addMessage('assistant', assistantMessage);
            
            // Check if any learning objectives are completed
            this.checkObjectiveCompletion(assistantMessage);
            
        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator();
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message error-message';
            errorMessage.innerHTML = `
                <div class="message-content">
                    <strong>Fout:</strong> ${error.message}
                    <br><br>
                    Zorg ervoor dat de lokale LLM server draait op http://localhost:1234
                </div>
            `;
            this.elements.messagesDiv.appendChild(errorMessage);
            this.scrollToBottom();
        } finally {
            this.isProcessing = false;
            this.elements.sendBtn.disabled = false;
            this.elements.status.textContent = 'Klaar';
            this.elements.status.classList.remove('loading');
        }
    }
    
    checkObjectiveCompletion(message) {
        if (!this.currentBlock) return;
        
        const lowerMessage = message.toLowerCase();
        
        // Check if the message indicates objective completion
        const completionPhrases = [
            'leerdoel behaald',
            'leerdoel is behaald',
            'objective completed',
            'goed begrepen',
            'uitstekend begrepen',
            'je begrijpt het',
            'dat klopt helemaal'
        ];
        
        const hasCompletionPhrase = completionPhrases.some(phrase => 
            lowerMessage.includes(phrase)
        );
        
        if (hasCompletionPhrase) {
            // Try to match with uncompleted objectives
            this.currentBlock.objectives.forEach(obj => {
                if (!obj.completed) {
                    const hasKeywords = obj.keywords.some(keyword => 
                        lowerMessage.includes(keyword.toLowerCase())
                    );
                    
                    if (hasKeywords) {
                        obj.completed = true;
                        this.showObjectiveCompletedNotification(obj);
                    }
                }
            });
            
            // Save progress
            this.saveLearningBlocks();
            
            // Check if all objectives in current block are completed
            const allCompleted = this.currentBlock.objectives.every(o => o.completed);
            if (allCompleted) {
                this.onBlockCompleted();
            }
        }
    }
    
    showObjectiveCompletedNotification(objective) {
        const notification = document.createElement('div');
        notification.className = 'message achievement-message';
        notification.innerHTML = `
            <div class="message-content">
                <strong>🎉 Leerdoel Behaald!</strong><br>
                ${objective.text}
            </div>
        `;
        this.elements.messagesDiv.appendChild(notification);
        this.scrollToBottom();
    }
    
    onBlockCompleted() {
        const currentBlockIndex = this.learningBlocks.findIndex(b => b.id === this.currentBlock.id);
        
        // Unlock next block
        if (currentBlockIndex < this.learningBlocks.length - 1) {
            this.learningBlocks[currentBlockIndex + 1].locked = false;
            this.saveLearningBlocks();
            
            const notification = document.createElement('div');
            notification.className = 'message achievement-message';
            notification.innerHTML = `
                <div class="message-content">
                    <strong>🎊 Blok Voltooid!</strong><br>
                    Je hebt ${this.currentBlock.title} afgerond! Het volgende blok is nu ontgrendeld.
                    <br><br>
                    <button class="back-to-start-btn">Terug naar Overzicht</button>
                </div>
            `;
            const backBtn = notification.querySelector('.back-to-start-btn');
            backBtn.addEventListener('click', () => this.goBackToStart());
            this.elements.messagesDiv.appendChild(notification);
            this.scrollToBottom();
        } else {
            const notification = document.createElement('div');
            notification.className = 'message achievement-message';
            notification.innerHTML = `
                <div class="message-content">
                    <strong>🏆 Gefeliciteerd!</strong><br>
                    Je hebt alle blokken voltooid! Geweldig werk!
                    <br><br>
                    <button class="back-to-start-btn">Terug naar Overzicht</button>
                </div>
            `;
            const backBtn = notification.querySelector('.back-to-start-btn');
            backBtn.addEventListener('click', () => this.goBackToStart());
            this.elements.messagesDiv.appendChild(notification);
            this.scrollToBottom();
        }
    }
    
    scrollToBottom() {
        this.elements.messagesDiv.scrollTop = this.elements.messagesDiv.scrollHeight;
    }
}

// Global instance for inline event handlers
let chatInterface;

document.addEventListener('DOMContentLoaded', () => {
    chatInterface = new ChatInterface();
});
