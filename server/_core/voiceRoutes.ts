import { Router, Request, Response } from 'express';
import { transcribeAudioGoogle, generateSpeechElevenLabs } from './voiceInterview';
import busboy from 'busboy';

const router = Router();

/**
 * POST /api/voice/speak
 * Generate speech from text using ElevenLabs TTS
 */
router.post('/voice/speak', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const audioBuffer = await generateSpeechElevenLabs(text);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate speech' });
  }
});

/**
 * POST /api/voice/transcribe
 * Transcribe audio using Google Cloud Speech-to-Text
 */
router.post('/voice/transcribe', async (req: Request, res: Response) => {
  try {
    // Parse multipart/form-data using busboy
    const bb = busboy({ headers: req.headers });
    let audioBuffer: Buffer | null = null;
    let responded = false;
    
    bb.on('file', async (fieldname: string, file: any, info: any) => {
      if (fieldname === 'audio') {
        const chunks: Buffer[] = [];
        
        file.on('data', (data: any) => {
          chunks.push(Buffer.from(data));
        });
        
        file.on('end', async () => {
          audioBuffer = Buffer.concat(chunks);
          console.log('[STT] Received audio:', audioBuffer.length, 'bytes');
          
          if (!responded) {
            responded = true;
            try {
              const text = await transcribeAudioGoogle(audioBuffer);
              console.log('[STT] Transcribed:', text);
              res.json({ text });
            } catch (error: any) {
              console.error('[STT] Transcription error:', error);
              res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
            }
          }
        });
      }
    });
    
    bb.on('error', (error: any) => {
      console.error('[STT] Parse error:', error);
      if (!responded) {
        responded = true;
        res.status(400).json({ error: 'Failed to parse audio file' });
      }
    });
    
    req.pipe(bb);
  } catch (error: any) {
    console.error('[STT] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

export default router;
