# Local LLM Chat Interface

Een moderne, gebruiksvriendelijke chat interface in JavaScript die communiceert met een lokaal draaiend LLM.

## Kenmerken

- 🎨 Modern en responsief UI design
- 💬 Real-time chat met een lokaal LLM op localhost:1234
- 🔓 Geen API key nodig - werkt direct met je lokale LLM
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

### 1. Start je lokale LLM server met LM Studio

#### LM Studio installeren en configureren

**Stap 1: Download en installeer LM Studio**

1. Ga naar [https://lmstudio.ai/](https://lmstudio.ai/)
2. Download LM Studio voor jouw besturingssysteem (Windows, macOS, of Linux)
3. Installeer de applicatie door het installatieprogramma te volgen

**Stap 2: Download een model**

1. Open LM Studio
2. Klik op het **"Search"** icoon (🔍) in de linker zijbalk
3. Zoek naar een model, bijvoorbeeld:
   - `llama-3.2-3b-instruct` (klein, snel model, gekwantiseerde versies vanaf ~2GB)
   - `mistral-7b-instruct` (middelgroot model, gekwantiseerde versies vanaf ~4GB)
   - `llama-2-13b-chat` (groter model voor betere resultaten, gekwantiseerde versies vanaf ~7GB)
4. Klik op de **"Download"** knop naast het model dat je wilt gebruiken
5. Wacht tot het model volledig is gedownload

**Stap 3: Start de lokale server**

1. Klik op het **"Local Server"** tabblad in de linker zijbalk van LM Studio
2. Selecteer het gedownloade model bovenaan de pagina uit het dropdown menu
3. Klik op de **"Start Server"** knop

**Stap 4: Configureer de server instellingen**

In het "Server Options" gedeelte aan de rechterkant van het scherm:

1. **Poort instellen:**
   - Zoek naar het veld **"Port"**
   - Stel de poort in op: `1234`
   - (Dit is de standaard poort die deze chat interface verwacht)

2. **CORS inschakelen:**
   - Zoek naar de checkbox **"Enable CORS"**
   - ✅ Vink deze optie **AAN**
   - Dit is nodig om de browser toegang te geven tot de lokale server

3. **Serve on Local Network (optioneel):**
   - Zoek naar de checkbox **"Serve on Local Network"**
   - Als je de chat interface wilt gebruiken vanaf andere apparaten op hetzelfde netwerk, vink deze optie aan
   - Anders kun je deze uitgeschakeld laten voor alleen lokale toegang

4. **Andere instellingen (optioneel):**
   - **Context Length**: Bepaalt hoeveel conversatiegeschiedenis het model onthoudt
   - **GPU Offload**: Hoeveel GPU lagen gebruikt worden (meer is sneller als je een GPU hebt)

**Stap 5: Controleer of de server draait**

- Je ziet een groen statusbericht: **"Server Running"** of **"Listening on http://localhost:1234"**
- De API endpoint is nu beschikbaar op: `http://localhost:1234/v1/chat/completions`

#### Alternatieve lokale LLM servers

Je kunt ook andere lokale LLM servers gebruiken:
- **Ollama**: Gebruik `ollama serve` (standaard poort 11434, pas de poort aan in `chat.js`)
- **llama.cpp server**: Start met de juiste parameters en poort 1234
- **LocalAI**: Configureer op poort 1234 met CORS ingeschakeld

### 2. Chat interface gebruiken

1. Open `index.html` in je browser (of start een lokale webserver zoals beschreven bij Installatie)
2. Begin direct met chatten!

Geen API key nodig - alle communicatie vindt plaats met je lokale LLM server.

## Bestandsstructuur

```
.
├── index.html      # Hoofd HTML bestand met de chat interface
├── styles.css      # Styling voor de chat interface
├── chat.js         # JavaScript logica voor OpenAI API integratie
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

- ✅ **Controleer of LM Studio server draait**: Je moet een groen "Server Running" bericht zien in LM Studio
- ✅ **Controleer de poort**: Zorg dat de poort in LM Studio ingesteld is op `1234`
- ✅ **Controleer CORS**: De "Enable CORS" checkbox moet aangevinkt zijn in LM Studio
- ✅ **Controleer of een model geladen is**: Selecteer een gedownload model voordat je de server start
- ✅ **Firewall**: Controleer firewall instellingen die localhost verkeer kunnen blokkeren

### Foutmeldingen

- **Connection refused** of **Failed to fetch**: 
  - LM Studio server draait niet → Start de server in LM Studio
  - Server draait op een andere poort → Pas de poort aan naar 1234 of wijzig de URL in `chat.js`
  
- **CORS errors** (bijv. "has been blocked by CORS policy"):
  - CORS is niet ingeschakeld in LM Studio → Vink "Enable CORS" aan in de Server Options
  - Herstart de server nadat je CORS hebt ingeschakeld
  
- **500 Server Error** of **Model error**:
  - Het model is niet correct geladen → Selecteer opnieuw het model en herstart de server
  - Onvoldoende geheugen → Kies een kleiner model of sluit andere applicaties
  - Check de LM Studio console voor specifieke error logs

### Chat laadt niet

- Open de browser console (F12) voor gedetailleerde error berichten
- Zorg dat JavaScript is ingeschakeld in je browser
- Test of de server bereikbaar is door naar `http://localhost:1234` te gaan in je browser (je zou een JSON response moeten zien)

### Langzame responses

- Kies een kleiner model (bijv. llama-3.2-3b in plaats van een 13b model)
- Verhoog "GPU Offload" in LM Studio als je een GPU hebt
- Verlaag de "Context Length" in de server instellingen
- Sluit andere zware applicaties

### LM Studio specifieke tips

- **Model download mislukt**: Check je internetverbinding en probeer opnieuw
- **Server start niet**: Probeer LM Studio opnieuw te starten
- **Model laadt niet**: Zorg dat het model volledig gedownload is (geen "Downloading..." status)
- **Poort al in gebruik**: Kies een andere poort (bijv. 1235) en pas de URL in `chat.js` aan

## Licentie

Dit project is beschikbaar voor persoonlijk en educatief gebruik.

## Credits

Ontwikkeld voor de AI Hackathon met ondersteuning voor lokale LLM's.

## Bijdragen

Suggesties en verbeteringen zijn welkom! Open een issue of pull request op GitHub.
