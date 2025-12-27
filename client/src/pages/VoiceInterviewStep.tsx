import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface VoiceInterviewStepProps {
  applicationId: number;
  onComplete: () => void;
}

export function VoiceInterviewStep({ applicationId, onComplete }: VoiceInterviewStepProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const interviewQuestions = [
    "Tell us about your experience in event staffing. What roles have you worked?",
    "Describe a challenging situation you faced at an event and how you handled it?",
    "Why are you interested in joining Vora.now?",
    "What qualities do you think make a great event staff member?",
    "How do you handle working with diverse teams and clients?"
  ];
  
  const submitInterview = trpc.interview.evaluate.useMutation({
    onSuccess: () => {
      toast.success("Voice interview submitted! We'll review and get back to you soon.");
      onComplete();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit interview');
      setIsProcessing(false);
    },
  });
  
  // Request microphone permission on mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setMicPermission('granted');
        // Stop the stream for now, we'll start it when recording
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        console.error('Microphone permission denied:', err);
        setMicPermission('denied');
        setError('Microphone permission denied. Please enable microphone access to use voice interview.');
      }
    };
    
    requestMicPermission();
  }, []);
  
  // Play the current question using TTS
  const playQuestion = async () => {
    if (isPlayingQuestion) return;
    
    setIsPlayingQuestion(true);
    setError(null);
    
    try {
      console.log('Fetching TTS for question:', interviewQuestions[currentQuestion]);
      
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: interviewQuestions[currentQuestion] }),
      });
      
      console.log('TTS response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      console.log('Audio blob received:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response from server');
      }
      
      // Create audio element and play
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio();
      audioRef.current = audio;
      audio.src = audioUrl;
      
      audio.onended = () => {
        console.log('Audio playback ended');
        setIsPlayingQuestion(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        console.error('Audio element error:', audio.error);
        const errorMsg = audio.error?.message || 'Unknown audio error';
        setError(`Could not play audio: ${errorMsg}`);
        setIsPlayingQuestion(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      console.log('Starting audio playback...');
      await audio.play();
      console.log('Audio playback started');
      
    } catch (err: any) {
      console.error('TTS error:', err);
      const errorMsg = err.message || 'Failed to play question';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsPlayingQuestion(false);
    }
  };
  
  // Start recording
  const startRecording = async () => {
    if (micPermission !== 'granted') {
      setError('Microphone permission required');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please check your microphone.');
      toast.error('Failed to start recording');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Transcribe audio using Google Cloud STT
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to transcribe audio');
      
      const data = await response.json();
      const transcribedText = data.text;
      
      // Update responses
      const newResponses = [...responses];
      newResponses[currentQuestion] = transcribedText;
      setResponses(newResponses);
      
      toast.success('Response recorded!');
    } catch (err: any) {
      console.error('STT error:', err);
      toast.error('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSubmit = () => {
    setIsProcessing(true);
    submitInterview.mutate({
      responses,
    });
  };
  
  const progress = ((currentQuestion + 1) / interviewQuestions.length) * 100;
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Voice Interview</CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {interviewQuestions.length}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Display */}
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-lg font-semibold text-center">
              {interviewQuestions[currentQuestion]}
            </p>
          </div>
          
          {/* Play Question Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={playQuestion}
              disabled={isPlayingQuestion || isRecording || isProcessing}
              className="gap-2"
            >
              <Volume2 className={`h-5 w-5 ${isPlayingQuestion ? 'animate-pulse' : ''}`} />
              {isPlayingQuestion ? 'Playing...' : 'Play Question'}
            </Button>
          </div>
          
          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || micPermission !== 'granted'}
              className="rounded-full h-16 w-16"
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 inline animate-spin mr-2" />
                  Processing your response...
                </>
              ) : isRecording ? (
                "Recording... Click to stop"
              ) : (
                "Click to start recording"
              )}
            </p>
          </div>
          
          {/* Response Display */}
          {responses[currentQuestion] && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-semibold text-green-900 dark:text-green-200">Response recorded</p>
              <p className="text-sm text-green-800 dark:text-green-300 mt-1">{responses[currentQuestion]}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0 || isProcessing || isRecording}
          className="flex-1"
        >
          Previous
        </Button>
        
        {currentQuestion < interviewQuestions.length - 1 ? (
          <Button 
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            disabled={!responses[currentQuestion] || isProcessing || isRecording}
            className="flex-1"
          >
            Next Question
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={responses.length < interviewQuestions.length || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Interview"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
