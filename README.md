# Vora Voice Interview System

**ElevenLabs + Google Cloud AI Hackathon Submission**

A conversational voice interview system that transforms hiring for Africa's informal workforce. Using ElevenLabs for natural speech synthesis and Google Cloud Speech-to-Text for real-time transcription, we've built a two-way voice conversation that removes friction from the gig economy hiring process.

## Problem

Africa's informal workforce (93% of Nigerian workers) remains invisible to formal employment systems. Event staffing requires manual vetting through WhatsApp, email, and phone calls—slow, inefficient, and prone to miscommunication. Candidates struggle to prove their capabilities, and event organizers waste time on unqualified applicants.

## Solution

**Voice Interview System**: A conversational AI that conducts real-time interviews with candidates, evaluates responses, and provides instant feedback. Candidates experience a natural, human-like conversation rather than filling out forms.

### How It Works

1. **Candidate applies** for an event gig on Vora.now
2. **Selects voice interview** option during application
3. **AI asks questions** via natural speech (ElevenLabs Conversational AI)
4. **Candidate speaks answers** using microphone
5. **Real-time conversation** with turn-taking and natural flow
6. **Gemini AI evaluates** candidate fit and provides scoring
7. **Results saved** for admin review and hiring decisions

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **ElevenLabs Widget** - Conversational AI embed
- **@elevenlabs/react** - React SDK for voice conversations

### Backend
- **Express.js** - API server
- **tRPC** - Type-safe API layer
- **Node.js** - Runtime

### AI & Voice
- **ElevenLabs Conversational AI** - Real-time voice conversations with STT + TTS + turn-taking
- **Google Gemini** - Candidate evaluation and scoring

### Database
- **MySQL/TiDB** - Application and interview data storage
- **Drizzle ORM** - Type-safe database queries

## Project Structure

```
vora-voice-interview/
├── VoiceInterview.tsx          # Voice interview component (ElevenLabs widget)
├── ChatInterview.tsx           # Chat interview component (text-based alternative)
├── roles.ts                    # Role definitions and interview questions
├── RoleApplication.tsx         # Role application page
├── roleApplications.ts         # tRPC router for applications
└── README.md
```

## Features

### Voice Interview
- ✅ Real-time voice conversation with AI (Ehi)
- ✅ Natural turn-taking and interruption handling
- ✅ Role-specific interview questions
- ✅ Dynamic variables (user name, role title)
- ✅ Call duration tracking
- ✅ Completion status detection

### Chat Interview (Alternative)
- ✅ Text-based conversation with AI
- ✅ Same interview questions as voice
- ✅ Copy-paste disabled for integrity
- ✅ Message history display
- ✅ Typing indicators

### Feature Flag
Toggle between voice and chat interviews with environment variable:
```env
VITE_USE_VOICE_INTERVIEW=true   # Voice interviews (default)
VITE_USE_VOICE_INTERVIEW=false  # Chat interviews
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- ElevenLabs account with Conversational AI agent
- Google Cloud project with Gemini API enabled

### Environment Setup

Create a `.env` file with:

```env
# ElevenLabs
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
ELEVENLABS_AGENT_ID=<your-agent-id>
VITE_ELEVENLABS_AGENT_ID=<your-agent-id>

# Google AI
GOOGLE_AI_API_KEY=<your-google-ai-api-key>

# Database
DATABASE_URL=<your-database-url>

# Feature Flags
VITE_USE_VOICE_INTERVIEW=true
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

## ElevenLabs Agent Configuration

### Setting Up Your Agent

1. Go to [ElevenLabs](https://elevenlabs.io) and create a Conversational AI agent
2. Configure the agent's system prompt to use dynamic variables:

```
You are Ehi, a friendly Nigerian recruiter for Vora.now. You're interviewing {{user_name}} for the {{role_title}} position.

Your role is to:
1. Greet the candidate warmly by name
2. Ask about their experience relevant to the {{role_title}} role
3. Ask the interview questions provided
4. Keep the conversation natural and encouraging
5. Thank them at the end

Interview questions to ask:
{{interview_questions}}
```

3. Copy your Agent ID and add it to your environment variables

### Dynamic Variables

The widget passes these variables to your agent:
- `user_name` - The candidate's name
- `role_title` - The role they're applying for (e.g., "Bartender")
- `role_description` - Description of the role
- `interview_questions` - Role-specific questions to ask

## Contributing

We welcome contributions to enhance the voice interview system!

### Areas for Contribution

#### 🎤 Voice Enhancement
- Improve conversation flow
- Add support for multiple languages
- Implement voice activity detection
- Add audio quality assessment

#### 🤖 AI & Evaluation
- Improve candidate scoring algorithms
- Add sentiment analysis to responses
- Implement role-specific evaluation criteria
- Create interview templates for different job types

#### 📱 User Experience
- Mobile optimization
- Accessibility improvements
- Better error handling
- Progress indicators

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/your-feature`)
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

For production deployment:

1. Ensure all environment variables are set
2. Run database migrations: `pnpm db:push`
3. Build production bundle: `pnpm build`
4. Start server: `pnpm start`

## Performance Metrics

- **Interview Duration**: 3-5 minutes
- **Voice Latency**: Real-time with ElevenLabs Conversational AI
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
- Email: osasisorae@gmail.com

## Acknowledgments

- **ElevenLabs** - Conversational AI platform
- **Google Cloud** - Gemini AI for evaluation

---

**Built for the ElevenLabs Challenge - AI Partner Catalyst Hackathon**

Transforming how Africa's informal workforce gets hired, one voice at a time.
