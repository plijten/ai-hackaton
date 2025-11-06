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

## LM Studio Setup (Aanbevolen)

LM Studio is een gebruiksvriendelijke desktop applicatie waarmee je eenvoudig grote taalmodellen (LLMs) lokaal kunt draaien. Het biedt een intuïtieve interface voor het downloaden, beheren en uitvoeren van AI-modellen zonder technische kennis.

### LM Studio installeren

1. **Download LM Studio**
   - Ga naar [https://lmstudio.ai/](https://lmstudio.ai/)
   - Klik op "Download" en kies de versie voor jouw besturingssysteem:
     - Windows (Windows 10/11)
     - macOS (Apple Silicon of Intel)
     - Linux (Ubuntu/Debian)
   
2. **Installeer de applicatie**
   - **Windows**: Voer het `.exe` bestand uit en volg de installatiewizard
   - **macOS**: Open het `.dmg` bestand en sleep LM Studio naar je Applications map
   - **Linux**: Pak het `.AppImage` bestand uit en maak het uitvoerbaar

### Model downloaden in LM Studio

1. **Open LM Studio** en ga naar het "Search" (🔍) tabblad
   
2. **Zoek een model**
   - Populaire keuzes voor Nederlands en algemeen gebruik:
     - `TheBloke/Llama-2-7B-Chat-GGUF` (goed voor beginners, 4-8 GB RAM)
     - `TheBloke/Mistral-7B-Instruct-v0.2-GGUF` (uitstekende kwaliteit, 4-8 GB RAM)
     - `TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF` (zeer krachtig, 16+ GB RAM)
   
3. **Download een quantization**
   - Klik op het model en kies een quantization variant (bijv. `Q4_K_M` of `Q5_K_M`)
   - Lagere quantization (Q2, Q3, Q4) = kleiner bestand, sneller maar minder nauwkeurig
   - Hogere quantization (Q5, Q6, Q8) = groter bestand, langzamer maar nauwkeuriger
   - **Aanbevolen voor meeste gebruikers**: `Q4_K_M` (goede balans tussen kwaliteit en snelheid)
   
4. **Wacht tot het downloaden voltooid is**
   - Dit kan enkele minuten tot een uur duren, afhankelijk van het model en je internetsnelheid
   - Je kunt de voortgang volgen in het "Downloads" tabblad

### LM Studio configureren en starten

#### Server starten met CORS ondersteuning

1. **Ga naar het "Local Server" (💻) tabblad** in LM Studio

2. **Selecteer je gedownloade model**
   - Klik op "Select a model to load"
   - Kies het model dat je hebt gedownload uit de lijst

3. **Configureer CORS (essentieel voor web applicaties)**
   - Klik op "Server Options" of het instellingen icoon (⚙️)
   - Zoek naar "CORS" instellingen
   - **Schakel "Enable CORS" in** (dit is cruciaal voor de browser toegang)
   - Laat het standaard op `*` staan voor lokale ontwikkeling (alle origins toestaan)
   
4. **Stel de poort in**
   - Standaard poort: `1234`
   - Als deze poort bezet is, kies een andere (bijv. `1235`, `8080`)
   - ⚠️ **Let op**: Als je een andere poort gebruikt, pas dan de URL aan in `chat.js` (zie "Aanpassingen" sectie)

5. **Start de server**
   - Klik op de groene "Start Server" knop
   - Wacht tot je het bericht ziet: "Server started on http://localhost:1234"
   - De status indicator moet groen zijn

6. **Verifieer de server**
   - Open je browser en ga naar `http://localhost:1234/v1/models`
   - Je zou een JSON response moeten zien met informatie over het geladen model
   - Als je een error ziet, controleer dan:
     - Of het model volledig is geladen (check de status in LM Studio)
     - Of de poort correct is (geen andere applicatie gebruikt poort 1234)
     - Of CORS is ingeschakeld

### Server configuratie details

**Belangrijke instellingen in LM Studio:**

- **Context Length**: Aantal tokens dat het model kan "onthouden" (bijv. 2048, 4096)
  - Hogere waarde = meer geheugen nodig, maar betere context
  - Voor deze chat app: 2048-4096 is voldoende

- **GPU Offload**: Aantal lagen dat op je GPU wordt uitgevoerd
  - Maximale waarde = snelste performance (als je een goede GPU hebt)
  - Als je problemen hebt, verlaag deze waarde of zet op 0 voor CPU-only

- **Temperature**: Creativiteit van het model (wordt ook in de chat app ingesteld)
  - Standaard in LM Studio: 0.7 (balans tussen creativiteit en consistentie)

- **CORS Origin**: Bepaalt welke websites toegang hebben
  - Voor lokale ontwikkeling: `*` (alle origins)
  - Voor productie: specificeer de exacte URL's die toegang mogen hebben

### CORS troubleshooting

Als je CORS errors krijgt in je browser console:

```
Access to fetch at 'http://localhost:1234/v1/chat/completions' from origin 'http://localhost:8000' 
has been blocked by CORS policy
```

**Oplossingen:**

1. **Controleer in LM Studio**:
   - CORS moet zijn ingeschakeld in Server Options
   - "Access-Control-Allow-Origin" moet op `*` staan of je specifieke origin bevatten

2. **Herstart de LM Studio server**:
   - Stop de server (rode "Stop Server" knop)
   - Wacht 5 seconden
   - Start opnieuw (groene "Start Server" knop)

3. **Browser cache wissen**:
   - Druk op `Ctrl+Shift+R` (Windows/Linux) of `Cmd+Shift+R` (macOS)
   - Of open Developer Tools (F12) → Network tabblad → vink "Disable cache" aan

4. **Alternatieve methode (als bovenstaande niet werkt)**:
   - Start LM Studio met command line argumenten voor CORS
   - Check de LM Studio documentatie voor je specifieke versie

### Tips voor optimale performance

- **RAM**: Zorg dat je genoeg vrij RAM hebt (minimaal 2x de model grootte)
- **GPU**: Als je een NVIDIA GPU hebt, zorg dat de juiste drivers zijn geïnstalleerd
- **Model selectie**: Start met kleinere modellen (7B) voordat je grotere modellen (13B+) probeert
- **Eerste run**: De eerste keer laden van een model kan langer duren (1-2 minuten)
- **Background apps**: Sluit geheugen-intensieve applicaties voor betere performance

## Bestandsstructuur

```
.
├── index.html      # Hoofd HTML bestand met de chat interface
├── styles.css      # Styling voor de chat interface
├── chat.js         # JavaScript logica voor de chat, modules en text-to-speech
├── settings.js     # Configuratiebestand voor de OpenAI API sleutel en standaard stem
├── leerdoelen.json # Lijst met leerdoelen waaruit modules automatisch worden opgebouwd
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

### Modules uit leerdoelen.json (nieuw)

De startpagina met modules wordt nu dynamisch opgebouwd uit `leerdoelen.json`. Voor ieder leerdoel in het JSON-bestand wordt automatisch één module aangemaakt met precies één leerdoel.

Voorbeeld van `leerdoelen.json`:

```json
{
    "leerdoelen": [
        { "id": 1, "beschrijving": "Heeft specialistische kennis van technieken ..." },
        { "id": 2, "beschrijving": "Heeft specialistische kennis van de achterliggende technologie ..." }
    ]
}
```

Belangrijke details:
- De titel van de module wordt `Leerdoel <id>`.
- De beschrijving wordt gebruikt als het enige leerdoel binnen de module.
- Slechts de eerste module is ontgrendeld; volgende modules ontgrendelen wanneer de vorige klaar is.
- Behaalde voortgang blijft bewaard in de browser via LocalStorage.

Als `leerdoelen.json` niet geladen kan worden, valt de app terug op een minimale ingebouwde fallback-module.

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
- Voor **LM Studio**: Zie de gedetailleerde setup instructies in de "LM Studio Setup" sectie hierboven

### Foutmeldingen

- **Connection refused**: LLM server draait niet of draait op een andere poort
  - Voor LM Studio: Check of de server is gestart in het "Local Server" tabblad
  - Verifieer dat het groene "Server started" bericht zichtbaar is
  
- **CORS errors**: Browser toegang wordt geblokkeerd door CORS policy
  - Voor LM Studio: Zie "CORS troubleshooting" in de "LM Studio Setup" sectie
  - Zorg dat CORS is ingeschakeld in de server instellingen
  - Herstart de server na het wijzigen van CORS instellingen
  
- **500 Server Error**: Probleem met je lokale LLM server
  - Check de server logs in LM Studio
  - Controleer of het model volledig is geladen
  - Zorg dat je genoeg RAM hebt voor het gekozen model

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
