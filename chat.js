class ChatInterface {
    constructor() {
        this.messages = [];
        this.isProcessing = false;
        this.systemPrompt = '';
        this.initialUserPrompt = '';
        
        this.elements = {
            chatContainer: document.getElementById('chatContainer'),
            messagesDiv: document.getElementById('messages'),
            userInput: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            status: document.getElementById('status')
        };
        
        this.init();
    }
    
    async init() {
        await this.loadPrompts();
        this.showChat();
        this.attachEventListeners();
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
    }
    
    showChat() {
        this.elements.chatContainer.classList.remove('hidden');
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
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
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
    
    scrollToBottom() {
        this.elements.messagesDiv.scrollTop = this.elements.messagesDiv.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});
