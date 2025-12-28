import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RotateCcw, PhoneOff, Mic, Loader2 } from 'lucide-react';

interface VoiceInterviewProps {
  agentId: string;
  roleTitle: string;
  roleDescription: string;
  interviewQuestions: readonly string[];
  userName?: string;
  onInterviewComplete: (status: 'completed' | 'incomplete') => void;
}

// Minimum duration in seconds to consider interview complete
const MIN_DURATION_FOR_COMPLETE = 60; // 1 minute minimum

export function VoiceInterview({ 
  agentId, 
  roleTitle, 
  roleDescription, 
  interviewQuestions,
  userName,
  onInterviewComplete 
}: VoiceInterviewProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [callResult, setCallResult] = useState<'completed' | 'incomplete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('📞 Connected to ElevenLabs');
      setCallStatus('active');
      startTimeRef.current = new Date();
      setError(null);
    },
    onDisconnect: () => {
      console.log('📞 Disconnected from ElevenLabs');
      // Calculate duration and determine result
      const duration = startTimeRef.current 
        ? (new Date().getTime() - startTimeRef.current.getTime()) / 1000 
        : 0;
      
      console.log(`📊 Interview duration: ${Math.round(duration)}s`);
      
      if (callStatus === 'active') {
        const isComplete = duration >= MIN_DURATION_FOR_COMPLETE;
        setCallStatus('ended');
        setCallResult(isComplete ? 'completed' : 'incomplete');
        
        if (isComplete) {
          setTimeout(() => {
            onInterviewComplete('completed');
          }, 3000);
        }
      }
    },
    onMessage: (message) => {
      console.log('💬 Message:', message);
    },
    onError: (error) => {
      console.error('❌ Conversation error:', error);
      setError('Connection error. Please try again.');
      setCallStatus('idle');
    },
  });

  const startInterview = useCallback(async () => {
    try {
      setCallStatus('connecting');
      setError(null);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Build the custom prompt with user info and role details
      const customPrompt = `You are Ehi, a friendly and professional AI interviewer for Vora.now, a platform that connects event staff with event organizers.

You are interviewing ${userName || 'a candidate'} for the ${roleTitle} position.

Role Description: ${roleDescription}

Interview Questions to ask (ask these one at a time, naturally):
${interviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Guidelines:
- Greet the candidate warmly by name if provided
- Ask questions one at a time and wait for responses
- Be encouraging and professional
- Keep the conversation natural and flowing
- After asking all questions, thank them and let them know their application will be reviewed`;

      // Start the conversation with the agent
      await conversation.startSession({
        agentId,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            prompt: {
              prompt: customPrompt,
            },
            firstMessage: `Hi ${userName || 'there'}! I'm Ehi, and I'll be conducting your interview for the ${roleTitle} position at Vora.now today. Are you ready to begin?`,
          },
        },
      });
      
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start interview. Please check your microphone permissions and try again.');
      setCallStatus('idle');
    }
  }, [agentId, conversation, roleTitle, roleDescription, interviewQuestions, userName]);

  const endInterview = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('Failed to end conversation:', err);
      // Force end state even if API call fails
      const duration = startTimeRef.current 
        ? (new Date().getTime() - startTimeRef.current.getTime()) / 1000 
        : 0;
      const isComplete = duration >= MIN_DURATION_FOR_COMPLETE;
      setCallStatus('ended');
      setCallResult(isComplete ? 'completed' : 'incomplete');
    }
  }, [conversation]);

  const retryInterview = useCallback(() => {
    setCallResult(null);
    setCallStatus('idle');
    setError(null);
    startTimeRef.current = null;
  }, []);

  // Show result after call ends
  if (callStatus === 'ended' && callResult) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        {callResult === 'completed' ? (
          <>
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold text-emerald-700">Interview Complete!</h3>
              <p className="text-muted-foreground max-w-md">
                Great job! Your interview has been submitted for review. We'll get back to you within 24-48 hours.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Redirecting to confirmation...
            </div>
          </>
        ) : (
          <>
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold text-amber-700">Interview Incomplete</h3>
              <p className="text-muted-foreground max-w-md">
                It looks like the interview ended early. To be considered for the role, please complete the full interview with Ehi (at least 1 minute).
              </p>
            </div>
            <Button 
              onClick={retryInterview}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold">Voice Interview with Ehi</h3>
        <p className="text-muted-foreground max-w-md">
          {callStatus === 'idle' && "Click the button below to start your interview. Speak naturally and answer Ehi's questions about your experience."}
          {callStatus === 'connecting' && "Connecting to Ehi..."}
          {callStatus === 'active' && "Interview in progress. Speak naturally and answer Ehi's questions."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Idle state - show start button */}
      {callStatus === 'idle' && (
        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={startInterview}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 h-16 px-8 text-lg"
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Voice Interview
          </Button>
          <div className="text-sm text-muted-foreground text-center max-w-md">
            <p>💡 Tip: Find a quiet space and speak clearly. The interview typically takes 3-5 minutes.</p>
          </div>
        </div>
      )}

      {/* Connecting state */}
      {callStatus === 'connecting' && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
          <p className="text-muted-foreground">Connecting to Ehi...</p>
        </div>
      )}

      {/* Active call state */}
      {callStatus === 'active' && (
        <div className="flex flex-col items-center gap-4">
          {/* Speaking indicator */}
          <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
            <Mic className="h-10 w-10 text-white" />
          </div>
          
          <Alert className="max-w-md border-emerald-200 bg-emerald-50">
            <AlertDescription className="text-sm text-emerald-800">
              Interview in progress. Complete at least 1 minute for your application to be considered.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={endInterview}
            variant="destructive"
            size="lg"
            className="bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Interview
          </Button>
        </div>
      )}
    </div>
  );
}
