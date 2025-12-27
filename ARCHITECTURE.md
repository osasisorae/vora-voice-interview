# Architecture: Voice Interview System

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VoiceInterviewStep Component                        │   │
│  │  - MediaRecorder API (audio capture)                 │   │
│  │  - Audio playback control                            │   │
│  │  - Interview state management                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FormData Upload (multipart/form-data)               │   │
│  │  - Audio blob from MediaRecorder                     │   │
│  │  - Interview metadata                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Voice Routes (/api/voice/*)                         │   │
│  │  ├─ POST /speak (TTS)                                │   │
│  │  └─ POST /transcribe (STT)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Busboy       │ │ Voice        │ │ tRPC Router  │         │
│  │ (FormData    │ │ Interview    │ │ (evaluate)   │         │
│  │  parser)     │ │ (TTS/STT)    │ │              │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐          ┌───▼────┐
    │ Database │          │ External │          │ Gemini │
    │ (MySQL)  │          │ APIs     │          │ API    │
    └──────────┘          └──────────┘          └────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌──────────────┐      ┌──────────────┐
              │ ElevenLabs   │      │ Google Cloud │
              │ TTS API      │      │ Speech API   │
              └──────────────┘      └──────────────┘
```

## Component Details

### 1. Frontend: VoiceInterviewStep Component

**Location**: `client/src/pages/VoiceInterviewStep.tsx`

**Responsibilities**:
- Request microphone permission from user
- Display interview questions
- Record audio from microphone using MediaRecorder API
- Play AI-generated questions via audio element
- Send audio to backend for transcription
- Display transcribed responses
- Manage interview state (recording, playing, processing)

**Key APIs Used**:
- `navigator.mediaDevices.getUserMedia()` - Request mic access
- `MediaRecorder` - Record audio stream
- `HTMLAudioElement` - Play TTS audio
- `fetch()` - Send audio to backend

**Interview Flow**:
```
1. User clicks "Play Question"
   ↓
2. Frontend calls /api/voice/speak with question text
   ↓
3. Backend returns MP3 audio
   ↓
4. Frontend plays audio via audio element
   ↓
5. User speaks their answer
   ↓
6. Frontend records audio with MediaRecorder
   ↓
7. User clicks "Submit Answer"
   ↓
8. Frontend sends audio blob to /api/voice/transcribe
   ↓
9. Backend transcribes and returns text
   ↓
10. Frontend displays transcription
    ↓
11. Move to next question (repeat 1-10)
    ↓
12. After 5 questions, submit interview
```

### 2. Backend: Voice Routes

**Location**: `server/_core/voiceRoutes.ts`

**Endpoints**:

#### POST /api/voice/speak
- **Input**: `{ text: string }`
- **Process**:
  1. Validate text input
  2. Call `generateSpeechElevenLabs(text)`
  3. Return MP3 audio buffer
- **Output**: `audio/mpeg` (MP3 buffer)
- **Error Handling**: 400 for invalid input, 500 for API errors

#### POST /api/voice/transcribe
- **Input**: FormData with audio blob
- **Process**:
  1. Parse FormData using busboy
  2. Extract audio buffer from file stream
  3. Call `transcribeAudioGoogle(audioBuffer)`
  4. Return transcribed text
- **Output**: `{ text: string }`
- **Error Handling**: 400 for parse errors, 500 for API errors

### 3. Voice Interview Logic

**Location**: `server/_core/voiceInterview.ts`

#### generateSpeechElevenLabs(text: string)
```
Input: Question text
  ↓
Create ElevenLabsClient with API key
  ↓
Call textToSpeech.convert() with:
  - Voice ID: 21m00Tcm4TlvDq8ikWAM (Rachel)
  - Model: eleven_multilingual_v2
  - Format: mp3_44100_128
  ↓
Read audio stream chunks
  ↓
Concatenate chunks into Buffer
  ↓
Return MP3 buffer (30-40KB per question)
```

#### transcribeAudioGoogle(audioBuffer: Buffer)
```
Input: MP3 audio buffer
  ↓
Create SpeechClient with Google Cloud credentials
  ↓
Prepare request with:
  - Audio content (base64-encoded)
  - Encoding: MP3
  - Language: en-US
  ↓
Call recognize() API
  ↓
Extract transcript from response
  ↓
Return transcribed text
```

### 4. Database Schema

**Interview Data Storage**:

```sql
CREATE TABLE gig_applications (
  id INT PRIMARY KEY,
  gigId INT,
  userId INT,
  currentStep ENUM('interview_choice', 'voice_interview', ...),
  createdAt TIMESTAMP
);

CREATE TABLE interview_responses (
  id INT PRIMARY KEY,
  applicationId INT,
  questionNumber INT,
  question TEXT,
  answer TEXT,
  audioUrl VARCHAR(255),
  transcription TEXT,
  evaluationScore FLOAT,
  evaluationNotes TEXT,
  recordedAt TIMESTAMP
);
```

## Data Flow

### TTS Flow (Question Generation)
```
User clicks "Play Question"
  ↓
VoiceInterviewStep calls fetch('/api/voice/speak', {text: question})
  ↓
voiceRoutes.ts receives request
  ↓
generateSpeechElevenLabs() calls ElevenLabs API
  ↓
ElevenLabs returns MP3 audio stream
  ↓
voiceInterview.ts concatenates chunks into Buffer
  ↓
Express sends Buffer as audio/mpeg response
  ↓
Frontend receives audio blob
  ↓
HTMLAudioElement plays audio
  ↓
User hears question
```

### STT Flow (Answer Transcription)
```
User speaks answer into microphone
  ↓
MediaRecorder captures audio stream
  ↓
User clicks "Submit Answer"
  ↓
VoiceInterviewStep creates FormData with audio blob
  ↓
Frontend calls fetch('/api/voice/transcribe', {body: formData})
  ↓
voiceRoutes.ts receives multipart/form-data
  ↓
busboy parses FormData and extracts audio file
  ↓
Audio buffer is passed to transcribeAudioGoogle()
  ↓
Google Cloud Speech API transcribes MP3
  ↓
transcribeAudioGoogle() returns text
  ↓
voiceRoutes.ts sends {text: "..."} response
  ↓
Frontend displays transcription
  ↓
Interview response stored in database
```

## Error Handling

### TTS Errors
```
ElevenLabs API Error
  ↓
generateSpeechElevenLabs() throws Error
  ↓
voiceRoutes.ts catches and logs error
  ↓
Returns 500 with error message
  ↓
Frontend displays "Failed to play audio"
  ↓
User can retry
```

### STT Errors
```
Google Cloud Speech API Error
  ↓
transcribeAudioGoogle() throws Error
  ↓
voiceRoutes.ts catches and logs error
  ↓
Returns 500 with error message
  ↓
Frontend displays "Failed to transcribe audio"
  ↓
User can retry recording
```

## Performance Considerations

### Audio Quality
- **Format**: MP3 (44.1kHz, 128kbps)
- **Size**: ~30KB per 10-second question
- **Latency**: <500ms for TTS generation
- **Transcription**: <2 seconds for 30-second audio

### Scalability
- **Concurrent Interviews**: Handled by Express connection pooling
- **Database**: Indexed on applicationId and userId
- **API Rate Limits**: 
  - ElevenLabs: 10,000 characters/month (free tier)
  - Google Cloud: 600 requests/minute (free tier)

## Security

### API Keys
- Stored in environment variables
- Never committed to repository
- Rotated regularly
- Logged only first 10 characters for debugging

### Audio Data
- Transmitted over HTTPS
- Stored in secure S3 bucket (optional)
- Deleted after 30 days (configurable)
- Access controlled by user authentication

### Feature Flag
- `ENABLE_VOICE_INTERVIEWS` environment variable
- Prevents accidental exposure of beta features
- Can be toggled without code deployment

## Testing Strategy

### Unit Tests
- Test TTS/STT functions with mock APIs
- Test error handling and edge cases
- Test audio buffer processing

### Integration Tests
- Test full interview flow
- Test API endpoints with real audio
- Test database storage

### Performance Tests
- Measure TTS generation time
- Measure STT transcription time
- Test with various audio qualities

## Future Enhancements

### Video Interview
- Add video recording component
- Store video in S3
- Implement video playback in admin dashboard

### Advanced AI
- Sentiment analysis on responses
- Role-specific evaluation criteria
- Follow-up question generation

### Internationalization
- Support multiple languages
- Regional accent handling
- Localized interview questions

### Analytics
- Track interview completion rates
- Measure candidate satisfaction
- Analyze response quality metrics
