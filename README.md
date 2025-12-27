# Vora.now - Voice Interview System

**ElevenLabs + Google Cloud AI Hackathon Submission**

Vora.now is a conversational voice interview system that transforms hiring for Africa's informal workforce. Using ElevenLabs for natural speech synthesis and Google Cloud Speech-to-Text for real-time transcription, we've built a two-way voice conversation that removes friction from the gig economy hiring process.

## Problem

Africa's informal workforce (93% of Nigerian workers) remains invisible to formal employment systems. Event staffing requires manual vetting through WhatsApp, email, and phone calls—slow, inefficient, and prone to miscommunication. Candidates struggle to prove their capabilities, and event organizers waste time on unqualified applicants.

## Solution

**Voice Interview System**: A conversational AI that conducts real-time interviews with candidates, evaluates responses, and provides instant feedback. Candidates experience a natural, human-like conversation rather than filling out forms.

### How It Works

1. **Candidate applies** for an event gig on Vora.now
2. **Selects voice interview** option during application
3. **AI asks 5 questions** via natural speech (ElevenLabs TTS)
4. **Candidate speaks answers** using microphone
5. **Google Cloud Speech-to-Text** transcribes responses in real-time
6. **Gemini AI evaluates** candidate fit and provides scoring
7. **Results saved** for admin review and hiring decisions

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **MediaRecorder API** - Audio capture from browser microphone
- **Web Audio API** - Audio playback

### Backend
- **Express.js** - API server
- **tRPC** - Type-safe API layer
- **Node.js** - Runtime

### AI & Voice
- **ElevenLabs API** - Text-to-speech (eleven_multilingual_v2 model)
- **Google Cloud Speech-to-Text** - Speech recognition with MP3 support
- **Google Gemini** - Candidate evaluation and scoring

### Database
- **MySQL/TiDB** - Application and interview data storage
- **Drizzle ORM** - Type-safe database queries

## Project Structure

```
vora-voice-interview/
├── client/
│   └── src/
│       └── pages/
│           └── VoiceInterviewStep.tsx       # Voice interview UI component
├── server/
│   ├── _core/
│   │   ├── voiceInterview.ts               # TTS & STT functions
│   │   ├── voiceRoutes.ts                  # Express routes for voice APIs
│   │   └── env.ts                          # Environment configuration
│   └── routers/
│       └── interview.ts                    # tRPC interview procedures
├── drizzle/
│   └── schema.ts                           # Database schema
└── README.md
```

## Features

### Current (MVP)
- ✅ Real-time voice conversation with AI
- ✅ 5-question structured interview
- ✅ Audio recording and transcription
- ✅ Candidate response storage
- ✅ Admin review dashboard
- ✅ Feature flag for safe deployment

### Coming Soon
- 🎥 Video interview option (candidate records video responses)
- 📊 Advanced candidate scoring with ML
- 🌍 Multi-language support
- 🎯 Role-specific interview templates
- 📱 Mobile app for candidates

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- Google Cloud project with Speech-to-Text API enabled
- ElevenLabs account with API key

### Environment Setup

Create a `.env.local` file with:

```env
# Google Cloud
GOOGLE_SERVICE_ACCOUNT_B64=<base64-encoded service account JSON>
GOOGLE_AI_API_KEY=<your-google-ai-api-key>

# ElevenLabs
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>

# Database
DATABASE_URL=<your-database-url>

# Feature Flags
ENABLE_VOICE_INTERVIEWS=true
```

### Installation

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

Server runs at `http://localhost:3000`

## API Endpoints

### TTS (Text-to-Speech)
```
POST /api/voice/speak
Content-Type: application/json

{
  "text": "Tell us about your experience in event staffing"
}

Response: audio/mpeg (MP3 audio buffer)
```

### STT (Speech-to-Text)
```
POST /api/voice/transcribe
Content-Type: multipart/form-data

FormData:
  - audio: <audio blob from MediaRecorder>

Response: { "text": "I have 5 years of experience..." }
```

## Contributing

We welcome contributions to enhance the voice interview system! 

### Areas for Contribution

#### 🎤 Audio Enhancement
- Improve speech recognition accuracy
- Add support for multiple languages
- Optimize audio encoding for different network conditions
- Implement voice activity detection (VAD)
- Add audio quality assessment

#### 🎥 Video Interview Feature
- Implement video recording from browser camera
- Add video playback in admin dashboard
- Create video quality checks
- Implement video compression for storage
- Add facial expression analysis (optional)

#### 🤖 AI & Evaluation
- Improve candidate scoring algorithms
- Add sentiment analysis to responses
- Implement role-specific evaluation criteria
- Create interview templates for different job types

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/audio-enhancement`)
3. **Make your changes** with clear commit messages
4. **Add tests** for new functionality
5. **Submit a pull request** with description of changes

### Code Style
- Use TypeScript for type safety
- Follow existing code patterns
- Add JSDoc comments for functions
- Write unit tests with Vitest

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- server/routers/interview.test.ts

# Watch mode
pnpm test -- --watch
```

## Deployment

The system is designed to run on Manus platform with automatic scaling and monitoring. For external deployment:

1. Ensure all environment variables are set
2. Run database migrations: `pnpm db:push`
3. Build production bundle: `pnpm build`
4. Start server: `pnpm start`

## Performance Metrics

- **Interview Duration**: 5-10 minutes
- **Audio Latency**: <500ms (TTS generation + playback)
- **Transcription Latency**: <2 seconds
- **Candidate Evaluation**: <5 seconds

## Security

- API keys stored in environment variables (never committed)
- Audio data encrypted in transit (HTTPS)
- Interview recordings stored securely with access controls
- No sensitive candidate data in logs
- Feature flag prevents accidental exposure of beta features

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Join our Discord community
- Email: support@vora.now

## Acknowledgments

- **ElevenLabs** - Natural voice synthesis
- **Google Cloud** - Speech recognition and AI
- **Manus** - Platform and infrastructure

---

**Built for the ElevenLabs Challenge - AI Partner Catalyst Hackathon**

Transforming how Africa's informal workforce gets hired, one voice at a time.
