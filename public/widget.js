// Imago Web Chat Widget

(function() {
    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    // Asume que está siendo servido por el backend
    styleLink.href = '/widget.css';
    document.head.appendChild(styleLink);

    // 2. Build HTML Structure
    const container = document.createElement('div');
    container.id = 'imago-widget-container';
    container.innerHTML = `
        <div id="imago-chat-window">
            <div id="imago-chat-header">
                <div>
                    <h3>Imago Bot</h3>
                    <span>Agente Virtual 24/7</span>
                </div>
                <button id="imago-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div id="imago-chat-messages">
                <div class="imago-message bot">¡Hola! Soy el asistente virtual de Imago. ¿En qué te puedo ayudar hoy?</div>
            </div>
            <div id="imago-chat-input-container">
                <input type="text" id="imago-chat-input" placeholder="Escribe tu mensaje..." autocomplete="off">
                <button id="imago-chat-send"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
        <button id="imago-widget-btn"><i class="fas fa-comment-dots fa-2x"></i></button>
    `;
    document.body.appendChild(container);

    // 3. Elements & State
    const chatWindow = document.getElementById('imago-chat-window');
    const widgetBtn = document.getElementById('imago-widget-btn');
    const closeBtn = document.getElementById('imago-close-btn');
    const sendBtn = document.getElementById('imago-chat-send');
    const inputField = document.getElementById('imago-chat-input');
    const messagesContainer = document.getElementById('imago-chat-messages');
    
    // Generar un ID único por sesión (simplificado)
    let sessionId = localStorage.getItem('imago_session_id');
    if (!sessionId) {
        sessionId = 'web_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('imago_session_id', sessionId);
    }

    // 4. Logic
    widgetBtn.addEventListener('click', () => {
        chatWindow.classList.add('open');
        widgetBtn.style.display = 'none';
        inputField.focus();
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        setTimeout(() => widgetBtn.style.display = 'flex', 300);
    });

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = \`imago-message \${sender}\`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'imago-message bot imago-typing-indicator';
        typingDiv.innerHTML = '<div class="imago-typing"><span></span><span></span><span></span></div>';
        typingDiv.id = 'imago-typing';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTyping() {
        const typingDiv = document.getElementById('imago-typing');
        if (typingDiv) typingDiv.remove();
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        inputField.value = '';
        showTyping();

        try {
            // Reemplazar localhost por tu dominio real en producción
            const response = await fetch('/api/chat/web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: sessionId,
                    message: text
                })
            });

            const data = await response.json();
            removeTyping();
            
            if (data.reply) {
                addMessage(data.reply, 'bot');
            } else {
                addMessage('Lo siento, hubo un problema al procesar tu mensaje.', 'bot');
            }

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            removeTyping();
            addMessage('Error de conexión. Intenta nuevamente.', 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
