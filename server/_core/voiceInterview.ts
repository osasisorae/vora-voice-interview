import speech from '@google-cloud/speech';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ENV } from './env';

let speechClient: any = null;

try {
  speechClient = new speech.SpeechClient({
    credentials: JSON.parse(Buffer.from(ENV.googleServiceAccountB64, 'base64').toString('utf-8')),
  });
  console.log('[Init] Google Cloud Speech client initialized');
} catch (error) {
  console.error('[Init] Failed to initialize Google Cloud Speech client:', error);
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ENV.elevenLabsApiKey,
});

/**
 * Transcribe audio using Google Cloud Speech-to-Text API
 */
export async function transcribeAudioGoogle(audioBuffer: Buffer): Promise<string> {
  try {
    if (!speechClient) {
      throw new Error('Google Cloud Speech client not initialized');
    }
    
    console.log('[STT] Transcribing audio:', audioBuffer.length, 'bytes');
    
    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: 'MP3' as const,
        languageCode: 'en-US',
      },
    };

    console.log('[STT] Sending request to Google Cloud Speech API');
    const [response] = await speechClient.recognize(request);
    
    console.log('[STT] Response received:', response);
    
    const transcription = response.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join('\n')
      .trim();

    console.log('[STT] Transcription result:', transcription);
    
    return transcription || 'No speech detected';
  } catch (error) {
    console.error('[STT] Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate speech using ElevenLabs API with official SDK
 */
export async function generateSpeechElevenLabs(text: string): Promise<Buffer> {
  try {
    console.log('[TTS] Generating speech with ElevenLabs SDK');
    console.log('[TTS] Text:', text);
    
    const audio = await elevenlabs.textToSpeech.convert(
      '21m00Tcm4TlvDq8ikWAM', // Default voice ID (Rachel)
      {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      }
    );

    // Convert ReadableStream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    
    const audioBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    console.log('[TTS] Generated audio:', audioBuffer.length, 'bytes');
    
    return audioBuffer;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[TTS] Failed:', errorMsg);
    throw new Error(`Failed to generate speech: ${errorMsg}`);
  }
}
