import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

interface VoiceInterviewProps {
  agentId: string;
  roleTitle: string;
  roleDescription: string;
  interviewQuestions: readonly string[];
  userName?: string;
  onInterviewComplete: (status: 'completed' | 'incomplete') => void;
}

const MIN_DURATION_FOR_COMPLETE = 60;

export function VoiceInterview({ 
  agentId, 
  onInterviewComplete 
}: VoiceInterviewProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const [callResult, setCallResult] = useState<'completed' | 'incomplete' | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const handleCallEnd = useCallback(() => {
    const duration = startTimeRef.current 
      ? (new Date().getTime() - startTimeRef.current.getTime()) / 1000 
      : 0;
    
    const isComplete = duration >= MIN_DURATION_FOR_COMPLETE;
    setCallStatus('ended');
    setCallResult(isComplete ? 'completed' : 'incomplete');
    
    if (isComplete) {
      setTimeout(() => onInterviewComplete('completed'), 3000);
    }
  }, [onInterviewComplete]);

  useEffect(() => {
    // Load widget script
    if (!document.querySelector('script[src*="convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      document.body.appendChild(script);
    }

    const setupListeners = () => {
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.addEventListener('elevenlabs-convai:call', () => {
          setCallStatus('active');
          startTimeRef.current = new Date();
        });
        widget.addEventListener('elevenlabs-convai:call-end', () => {
          handleCallEnd();
        });
      }
    };

    setTimeout(setupListeners, 500);
    setTimeout(setupListeners, 1500);
  }, [handleCallEnd]);

  const retryInterview = () => {
    setCallResult(null);
    setCallStatus('idle');
    startTimeRef.current = null;
    window.location.reload();
  };

  if (callStatus === 'ended' && callResult) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        {callResult === 'completed' ? (
          <>
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-semibold text-emerald-700">Interview Complete!</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Great job! We'll get back to you within 24-48 hours.
            </p>
          </>
        ) : (
          <>
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-amber-700">Interview Incomplete</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Please complete at least 1 minute to be considered.
            </p>
            <Button onClick={retryInterview} className="bg-emerald-600 hover:bg-emerald-700">
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <h3 className="text-2xl font-semibold">Voice Interview with Ehi</h3>
      <p className="text-muted-foreground max-w-md text-center">
        Click the phone icon to start. Click it again to end.
      </p>

      {callStatus === 'active' && (
        <Alert className="max-w-md border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-sm text-emerald-800">
            Interview in progress. Complete at least 1 minute.
          </AlertDescription>
        </Alert>
      )}

      {/* Pure default widget - just agent-id */}
      <div dangerouslySetInnerHTML={{
        __html: `<elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>`
      }} />

      {callStatus === 'idle' && (
        <p className="text-sm text-muted-foreground">
          💡 Find a quiet space. Interview takes 3-5 minutes.
        </p>
      )}
    </div>
  );
}
