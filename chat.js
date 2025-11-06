// Learning blocks configuration version (increment when structure changes)
const BLOCKS_VERSION = 1;

// Learning blocks configuration
const LEARNING_BLOCKS = [
    {
        id: 1,
        title: "Blok 1: Basis Programmeerconcepten",
        description: "Leer de fundamenten van programmeren",
        objectives: [
            {
                id: 1,
                text: "Variabelen en datatypes begrijpen",
                keywords: ["variabele", "datatype", "string", "number", "boolean"],
                completed: false
            },
            {
                id: 2,
                text: "Loops en conditionals toepassen",
                keywords: ["loop", "if", "else", "for", "while", "conditional"],
                completed: false
            }
        ],
        locked: false
    },
    {
        id: 2,
        title: "Blok 2: Functies en Arrays",
        description: "Werk met functies en datastructuren",
        objectives: [
            {
                id: 3,
                text: "Functies schrijven en aanroepen",
                keywords: ["functie", "function", "parameter", "return"],
                completed: false
            },
            {
                id: 4,
                text: "Arrays manipuleren",
                keywords: ["array", "push", "pop", "map", "filter"],
                completed: false
            }
        ],
        locked: true
    },
    {
        id: 3,
        title: "Blok 3: DOM Manipulatie",
        description: "Interactieve webpagina's maken",
        objectives: [
            {
                id: 5,
                text: "DOM elementen selecteren en wijzigen",
                keywords: ["dom", "queryselector", "innerhtml", "element"],
                completed: false
            },
            {
                id: 6,
                text: "Event listeners toevoegen",
                keywords: ["event", "listener", "click", "addeventlistener"],
                completed: false
            }
        ],
        locked: true
    }
];

class ChatInterface {
    constructor() {
        this.messages = [];
        this.isProcessing = false;

        this.learningBlocks = this.loadLearningBlocks();
        this.currentBlock = null;

        this.systemPrompt = '';
        this.initialUserPrompt = '';

        
        this.elements = {
            startPage: document.getElementById('startPage'),
            blocksContainer: document.getElementById('blocksContainer'),
            chatContainer: document.getElementById('chatContainer'),
            messagesDiv: document.getElementById('messages'),
            userInput: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            status: document.getElementById('status'),
            backBtn: document.getElementById('backBtn')
        };
        
        this.init();
    }
    
    loadLearningBlocks() {
        const saved = localStorage.getItem('learningBlocks');
        const savedVersion = localStorage.getItem('blocksVersion');
        
        // Check if saved data exists and version matches
        if (saved && saved !== 'undefined' && savedVersion === String(BLOCKS_VERSION)) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to parse saved learning blocks, using defaults', e);
            }
        }
        
        // Version mismatch or no saved data - use default blocks
        const blocks = JSON.parse(JSON.stringify(LEARNING_BLOCKS)); // Deep copy
        this.saveLearningBlocks();
        return blocks;
    }
    
    saveLearningBlocks() {
        localStorage.setItem('learningBlocks', JSON.stringify(this.learningBlocks));
        localStorage.setItem('blocksVersion', String(BLOCKS_VERSION));
    }
    
    async init() {
        await this.loadPrompts();
        this.renderStartPage();
        this.attachEventListeners();
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
        this.elements.messagesDiv.appendChild(messageDiv);
        
        this.scrollToBottom();
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
