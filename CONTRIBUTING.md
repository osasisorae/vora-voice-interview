# Contributing to Vora.now Voice Interview System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Vora.now voice interview system.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Report issues professionally

## Getting Started

### 1. Fork and Clone
```bash
git clone git@github.com:YOUR_USERNAME/vora-voice-interview.git
cd vora-voice-interview
```

### 2. Set Up Development Environment
```bash
pnpm install
cp .env.example .env.local
# Add your API keys to .env.local
pnpm db:push
pnpm dev
```

### 3. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

## Development Areas

### 🎤 Audio Interview Enhancement

**Current Implementation:**
- ElevenLabs TTS for question generation
- Google Cloud Speech-to-Text for transcription
- MediaRecorder API for audio capture
- MP3 encoding for storage

**Contribution Ideas:**
- [ ] Add voice activity detection (VAD) to skip silence
- [ ] Implement adaptive audio quality based on network speed
- [ ] Add support for different voice personas
- [ ] Optimize audio compression without quality loss
- [ ] Implement audio preprocessing (noise reduction, normalization)
- [ ] Add support for accents and regional dialects
- [ ] Create audio quality scoring system

**Files to Focus On:**
- `server/_core/voiceInterview.ts` - TTS/STT logic
- `server/_core/voiceRoutes.ts` - API endpoints
- `client/src/pages/VoiceInterviewStep.tsx` - UI component

### 🎥 Video Interview Feature (Coming Soon)

**Planned Implementation:**
- Browser camera capture using getUserMedia
- Video encoding and compression
- Video playback in admin dashboard
- Facial expression analysis (optional)

**Contribution Ideas:**
- [ ] Implement video recording component
- [ ] Add video quality detection
- [ ] Create video compression pipeline
- [ ] Build video playback interface
- [ ] Implement video storage optimization
- [ ] Add video analytics (duration, quality metrics)

**Files to Create:**
- `client/src/pages/VideoInterviewStep.tsx` - Video recording UI
- `server/_core/videoInterview.ts` - Video processing logic
- `server/_core/videoRoutes.ts` - Video API endpoints

### 🤖 AI & Evaluation

**Current Implementation:**
- Gemini API for response evaluation
- Basic scoring system
- Response storage

**Contribution Ideas:**
- [ ] Implement sentiment analysis
- [ ] Add role-specific evaluation criteria
- [ ] Create interview templates
- [ ] Build candidate scoring model
- [ ] Add response quality metrics
- [ ] Implement follow-up question generation

**Files to Focus On:**
- `server/routers/interview.ts` - Interview procedures
- `server/db.ts` - Database queries for evaluation

## Making Changes

### Code Style

**TypeScript:**
```typescript
// Use explicit types
const processAudio = async (buffer: Buffer): Promise<string> => {
  // Implementation
};

// Add JSDoc comments
/**
 * Transcribe audio using Google Cloud Speech-to-Text
 * @param audioBuffer - Raw audio data in MP3 format
 * @returns Transcribed text
 */
export async function transcribeAudioGoogle(audioBuffer: Buffer): Promise<string> {
  // Implementation
}
```

**React Components:**
```typescript
// Use functional components with hooks
interface VoiceInterviewProps {
  applicationId: number;
  onComplete: () => void;
}

export function VoiceInterviewStep({ applicationId, onComplete }: VoiceInterviewProps) {
  const [state, setState] = useState<State>('idle');
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Testing

Write tests for new features:

```typescript
// server/routers/interview.test.ts
import { describe, it, expect } from 'vitest';

describe('Interview Router', () => {
  it('should transcribe audio correctly', async () => {
    const audioBuffer = Buffer.from('...');
    const result = await transcribeAudioGoogle(audioBuffer);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
```

Run tests:
```bash
pnpm test
pnpm test -- --watch
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add voice activity detection to audio processing
fix: Resolve audio encoding issue with MP3 files
docs: Update README with video interview roadmap
test: Add tests for transcription accuracy
```

## Submitting Changes

### 1. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 2. Create Pull Request
- Go to GitHub and create a PR
- Use a clear title describing the change
- Link any related issues
- Describe what you changed and why

### 3. PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement
- [ ] Documentation

## Related Issues
Closes #123

## Testing
Describe how you tested this change

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

## Review Process

1. **Automated Checks**: Tests and linting run automatically
2. **Code Review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Merge**: Your PR gets merged!

## Documentation

### Adding Documentation
- Update README.md for user-facing changes
- Add JSDoc comments to functions
- Create examples for new features
- Update API documentation

### Example Documentation
```typescript
/**
 * Generate speech from text using ElevenLabs
 * 
 * @example
 * const audio = await generateSpeechElevenLabs("Hello world");
 * // Returns MP3 audio buffer
 * 
 * @param text - Text to convert to speech
 * @returns Promise<Buffer> - MP3 audio data
 * @throws Error if text is empty or API fails
 */
export async function generateSpeechElevenLabs(text: string): Promise<Buffer> {
  // Implementation
}
```

## Reporting Issues

### Bug Reports
Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, etc.)
- Error messages/logs

### Feature Requests
Include:
- Clear description of the feature
- Why it's needed
- Proposed implementation (optional)
- Related issues/discussions

## Questions?

- Check existing issues and discussions
- Review the README and documentation
- Ask in pull request comments
- Email: dev@vora.now

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Vora.now! 🎉
