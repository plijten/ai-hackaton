class ChatInterface {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key');
        this.messages = [];
        this.isProcessing = false;
        
        this.elements = {
            apiKeySection: document.getElementById('apiKeySection'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
            chatContainer: document.getElementById('chatContainer'),
            messagesDiv: document.getElementById('messages'),
            userInput: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            status: document.getElementById('status')
        };
        
        this.init();
    }
    
    init() {
        if (this.apiKey) {
            this.showChat();
        } else {
            this.showApiKeyInput();
        }
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        this.elements.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
        
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
    
    saveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('Voer een geldige API key in');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            alert('OpenAI API keys beginnen meestal met "sk-". Weet je zeker dat dit correct is?');
        }
        
        // Note: API key is stored in plain text in localStorage
        // This is acceptable for a demo/hackathon project where the key is only used client-side
        // For production use, consider additional security measures
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        this.showChat();
    }
    
    showApiKeyInput() {
        this.elements.apiKeySection.classList.remove('hidden');
        this.elements.chatContainer.classList.add('hidden');
    }
    
    showChat() {
        this.elements.apiKeySection.classList.add('hidden');
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
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                mode: 'cors', // Explicitly set CORS mode
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: this.messages,
                    temperature: 0.7,
                    max_tokens: 1000
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
                    ${error.message.includes('API') || error.message.includes('401') ? 
                        'Controleer je API key en probeer het opnieuw. Je kunt je API key opnieuw instellen door de pagina te herladen.' : 
                        'Probeer het opnieuw.'}
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
