import { useEffect, useRef, useState } from 'react';
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

// Minimum duration in seconds to consider interview complete
const MIN_DURATION_FOR_COMPLETE = 60; // 1 minute minimum

// Helper to escape strings for use in HTML attributes
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '\\n');
}

export function VoiceInterview({ 
  agentId, 
  roleTitle, 
  roleDescription, 
  interviewQuestions,
  userName,
  onInterviewComplete 
}: VoiceInterviewProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const [callResult, setCallResult] = useState<'completed' | 'incomplete' | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Prepare dynamic variables for the agent - escape special characters
  const dynamicVariables = {
    user_name: userName || 'there',
    role_title: roleTitle,
    role_description: roleDescription,
    interview_questions: interviewQuestions.join(' | '), // Use pipe separator instead of newlines
  };

  // Create a safe JSON string for the HTML attribute
  const safeJsonString = escapeHtmlAttr(JSON.stringify(dynamicVariables));

  useEffect(() => {
    // Load the widget script if not already loaded
    if (!document.querySelector('script[src*="convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    // Set up event listeners after a short delay to ensure widget is loaded
    const setupListeners = () => {
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        // Listen for call start
        widget.addEventListener('elevenlabs-convai:call', (event: any) => {
          console.log('📞 Call started', event.detail);
          setCallStatus('active');
          startTimeRef.current = new Date();
        });

        // Listen for call end
        widget.addEventListener('elevenlabs-convai:call-end', (event: any) => {
          console.log('📞 Call ended', event.detail);
          handleCallEnd();
        });

        // Alternative event name
        widget.addEventListener('elevenlabs-convai:end', (event: any) => {
          console.log('📞 Call ended (alt event)', event.detail);
          handleCallEnd();
        });
      }
    };

    // Try to set up listeners immediately and also after a delay
    setupListeners();
    const timeoutId = setTimeout(setupListeners, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [agentId]);

  const handleCallEnd = () => {
    if (callStatus === 'ended') return; // Prevent double handling
    
    setCallStatus('ended');
    
    // Calculate if interview was completed based on duration
    const duration = startTimeRef.current 
      ? (new Date().getTime() - startTimeRef.current.getTime()) / 1000 
      : 0;
    
    console.log(`📊 Interview duration: ${Math.round(duration)}s`);
    
    // Determine if complete based on duration
    const isComplete = duration >= MIN_DURATION_FOR_COMPLETE;
    
    setCallResult(isComplete ? 'completed' : 'incomplete');
    
    // Notify parent after a short delay to show the result UI
    if (isComplete) {
      setTimeout(() => {
        onInterviewComplete('completed');
      }, 3000);
    }
  };

  const getWidgetHtml = () => {
    return `
      <elevenlabs-convai
        agent-id="${agentId}"
        variant="expanded"
        avatar-orb-color-1="#10B981"
        avatar-orb-color-2="#059669"
        action-text="Start Interview"
        start-call-text="Begin Interview"
        end-call-text="End Interview"
        listening-text="Listening to your response..."
        speaking-text="Ehi is speaking..."
        dynamic-variables='${safeJsonString}'
      ></elevenlabs-convai>
    `;
  };

  const retryInterview = () => {
    setCallResult(null);
    setCallStatus('idle');
    startTimeRef.current = null;
    
    // Reload the widget by re-rendering
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
      widgetContainerRef.current.innerHTML = getWidgetHtml();
    }
  };

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
          Click the microphone button below to start your interview. Speak naturally and answer Ehi's questions about your experience.
        </p>
      </div>

      {/* ElevenLabs Widget */}
      <div
        ref={widgetContainerRef}
        dangerouslySetInnerHTML={{
          __html: getWidgetHtml(),
        }}
      />

      {callStatus === 'active' && (
        <Alert className="max-w-md">
          <AlertDescription className="text-sm">
            Interview in progress. Complete at least 1 minute for your application to be considered.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground text-center max-w-md">
        <p>💡 Tip: Find a quiet space and speak clearly. The interview typically takes 3-5 minutes.</p>
      </div>
    </div>
  );
}
