# Local LLM Chat Interface

Een moderne, gebruiksvriendelijke chat interface in JavaScript die communiceert met een lokaal draaiend LLM.

## Kenmerken

- 🎨 Modern en responsief UI design
- 💬 Real-time chat met een lokaal LLM op localhost:1234
- 🔊 Directe voorleesfunctie via OpenAI text-to-speech (met stemkeuze)
- 🔓 Geen API key nodig voor chatten met je lokale LLM
- ⚡ Snelle en soepele gebruikerservaring
- 📱 Volledig responsive (werkt op desktop en mobiel)
- 🌐 Privacy-vriendelijk - alle communicatie blijft lokaal

## Installatie

### Optie 1: Direct openen

1. Clone deze repository of download de bestanden
2. Open `index.html` in je webbrowser

### Optie 2: Met een lokale webserver

```bash
# Met Python 3
python -m http.server 8000

# Met Node.js
npx http-server

# Met PHP
php -S localhost:8000
```

Navigeer vervolgens naar `http://localhost:8000` in je browser.

## Gebruik

### 1. Start je lokale LLM server

Zorg ervoor dat je lokale LLM server draait op `http://localhost:1234` met een OpenAI-compatibele API endpoint (`/v1/chat/completions`).

Voorbeelden van lokale LLM servers:
- **LM Studio**: Start een server met je favoriete model
- **Ollama**: Gebruik `ollama serve` (standaard poort 11434, pas eventueel de code aan)
- **llama.cpp server**: Start met de juiste parameters
- **LocalAI**: Configureer op poort 1234

### 2. Chat interface gebruiken

1. Open `index.html` in je browser
2. Begin direct met chatten!

Geen API key nodig om te chatten - alle communicatie vindt plaats met je lokale LLM server. 

🆕 **Text-to-speech**: om antwoorden te laten voorlezen, is een OpenAI API sleutel nodig.

## Bestandsstructuur

```
.
├── index.html      # Hoofd HTML bestand met de chat interface
├── styles.css      # Styling voor de chat interface
├── chat.js         # JavaScript logica voor de chat en text-to-speech
├── settings.js     # Configuratiebestand voor de OpenAI API sleutel en standaard stem
└── README.md       # Deze documentatie
```

## Technische Details

### Lokale LLM API Configuratie

De chat interface communiceert met je lokale LLM server op:

- **Endpoint**: `http://localhost:1234/v1/chat/completions`
- **Temperature**: `0.7` (balans tussen creativiteit en consistentie)
- **Max Tokens**: `1000` (maximale lengte van antwoorden)
- **Authenticatie**: Geen API key vereist

### Privacy en Beveiliging

✅ **Privacy voordelen:**

- Geen API keys nodig
- Alle data blijft lokaal op je machine
- Geen externe API calls naar cloud diensten
- Volledige controle over je data en model

**Technische setup:**
- Alle API calls gaan naar localhost:1234
- Geen authenticatie headers vereist
- OpenAI-compatibele API formaat voor maximale compatibiliteit

### Browser Compatibiliteit

- Chrome/Edge (versie 90+)
- Firefox (versie 88+)
- Safari (versie 14+)
- Opera (versie 76+)

Vereist moderne JavaScript features zoals:
- ES6 Classes
- Async/Await
- Fetch API
- LocalStorage API

## Aanpassingen

### Lokale LLM server poort wijzigen

Als je lokale LLM server op een andere poort draait, pas de URL aan in `chat.js`:

```javascript
const response = await fetch('http://localhost:JOUW_POORT/v1/chat/completions', {
    // ... rest van de configuratie
});
```

### Styling aanpassen

De kleuren en styling kunnen aangepast worden in `styles.css`. De belangrijkste kleurenschema's zijn:

- Primaire gradient: `#667eea` tot `#764ba2`
- Achtergrond: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Berichten achtergrond: `#f1f3f5`

### Text-to-speech configureren

1. Open `settings.js` en vul je OpenAI API sleutel in bij `OPENAI_API_KEY`.
2. (Optioneel) Kies een standaard stem met `DEFAULT_TTS_VOICE` (bijv. `alloy`, `verse`, `sol`, `luna`, `ember`).
3. Vernieuw de pagina in je browser. In de chat verschijnt nu een dropdown om stemmen te wisselen en een voorleesknop bij ieder AI-antwoord.

De audio wordt gestreamd via de OpenAI text-to-speech API zodat je vrijwel direct kunt luisteren terwijl het antwoord nog binnenkomt.

### System Prompt toevoegen

Om een system prompt toe te voegen die de AI's gedrag bepaalt, voeg dit toe aan de `messages` array in `chat.js`:

```javascript
constructor() {
    this.messages = [{
        role: 'system',
        content: 'Je bent een behulpzame assistent die in het Nederlands antwoord geeft.'
    }];
    // ... rest van de code
}
```

## Problemen oplossen

### Kan geen verbinding maken met lokale LLM

- Controleer of je lokale LLM server draait op poort 1234
- Zorg dat de server een OpenAI-compatibele API biedt op `/v1/chat/completions`
- Controleer firewall instellingen die localhost verkeer kunnen blokkeren

### Foutmeldingen

- **Connection refused**: LLM server draait niet of draait op een andere poort
- **CORS errors**: Sommige LLM servers hebben CORS configuratie nodig voor browser toegang
- **500 Server Error**: Probleem met je lokale LLM server, check de server logs

### Chat laadt niet

- Open de browser console (F12) voor error berichten
- Zorg dat JavaScript is ingeschakeld in je browser
- Controleer of de LLM server bereikbaar is op http://localhost:1234

## Licentie

Dit project is beschikbaar voor persoonlijk en educatief gebruik.

## Credits

Ontwikkeld voor de AI Hackathon met ondersteuning voor lokale LLM's.

## Bijdragen

Suggesties en verbeteringen zijn welkom! Open een issue of pull request op GitHub.
