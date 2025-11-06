# OpenAI Chat Interface

Een moderne, gebruiksvriendelijke chat interface in JavaScript die via de OpenAI API met gebruikers kan communiceren.

## Kenmerken

- 🎨 Modern en responsief UI design
- 💬 Real-time chat met OpenAI's GPT-3.5 Turbo model
- 🔐 Veilige lokale opslag van API key (wordt alleen in je browser opgeslagen)
- ⚡ Snelle en soepele gebruikerservaring
- 📱 Volledig responsive (werkt op desktop en mobiel)
- 🌐 Geen backend server nodig - werkt volledig in de browser

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

### 1. API Key verkrijgen

1. Ga naar [OpenAI Platform](https://platform.openai.com/api-keys)
2. Log in of maak een account aan
3. Maak een nieuwe API key aan
4. Kopieer de key (hij begint met `sk-`)

### 2. Chat interface gebruiken

1. Open `index.html` in je browser
2. Voer je OpenAI API key in wanneer daarom gevraagd wordt
3. Klik op "Opslaan"
4. Begin met chatten!

Je API key wordt veilig opgeslagen in de local storage van je browser en wordt alleen naar OpenAI gestuurd om berichten te verwerken.

## Bestandsstructuur

```
.
├── index.html      # Hoofd HTML bestand met de chat interface
├── styles.css      # Styling voor de chat interface
├── chat.js         # JavaScript logica voor OpenAI API integratie
└── README.md       # Deze documentatie
```

## Technische Details

### OpenAI API Configuratie

De chat interface gebruikt de volgende OpenAI API instellingen:

- **Model**: `gpt-3.5-turbo`
- **Temperature**: `0.7` (balans tussen creativiteit en consistentie)
- **Max Tokens**: `1000` (maximale lengte van antwoorden)

### Beveiliging

- API keys worden alleen lokaal opgeslagen in browser local storage
- Geen API keys worden naar andere servers gestuurd (behalve OpenAI)
- HTTPS wordt aanbevolen voor productie gebruik
- Alle API calls gaan direct van de browser naar OpenAI

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

### Model wijzigen

In `chat.js`, wijzig de `model` parameter in de API call:

```javascript
body: JSON.stringify({
    model: 'gpt-4',  // Wijzig naar gpt-4 of een ander model
    messages: this.messages,
    temperature: 0.7,
    max_tokens: 1000
})
```

### Styling aanpassen

De kleuren en styling kunnen aangepast worden in `styles.css`. De belangrijkste kleurenschema's zijn:

- Primaire gradient: `#667eea` tot `#764ba2`
- Achtergrond: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Berichten achtergrond: `#f1f3f5`

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

### API Key werkt niet

- Controleer of de API key correct is overgenomen (geen extra spaties)
- Zorg dat je OpenAI account credits heeft
- Controleer of je API key niet is verlopen of ingetrokken

### Foutmeldingen

- **401 Unauthorized**: API key is ongeldig of verlopen
- **429 Too Many Requests**: Rate limit bereikt, wacht even en probeer opnieuw
- **500 Server Error**: OpenAI server probleem, probeer later opnieuw

### Chat laadt niet

- Controleer je internetverbinding
- Open de browser console (F12) voor error berichten
- Zorg dat JavaScript is ingeschakeld in je browser

## Licentie

Dit project is beschikbaar voor persoonlijk en educatief gebruik.

## Credits

Ontwikkeld voor de AI Hackathon met OpenAI's GPT API.

## Bijdragen

Suggesties en verbeteringen zijn welkom! Open een issue of pull request op GitHub.
