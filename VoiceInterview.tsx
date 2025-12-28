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

// Simple text cleaner - remove problematic characters
function cleanText(str: string): string {
  return str
    .replace(/[\n\r\t]/g, ' ')  // Replace newlines/tabs with space
    .replace(/'/g, '')           // Remove apostrophes (they break HTML attribute)
    .replace(/"/g, '')           // Remove quotes
    .replace(/\\/g, '')          // Remove backslashes
    .trim();
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
  const widgetCreatedRef = useRef(false);
  const callEndedRef = useRef(false);

  // Build dynamic variables - clean text to avoid JSON/HTML issues
  const dynamicVars = {
    user_name: cleanText(userName || 'there'),
    role_title: cleanText(roleTitle),
    role_description: cleanText(roleDescription.substring(0, 150)),
    interview_questions: cleanText(interviewQuestions.slice(0, 2).join(' and ')),
  };
  const dynamicVarsJson = JSON.stringify(dynamicVars).replace(/'/g, '&#39;');

  const handleCallEnd = useCallback(() => {
    // Prevent multiple calls
    if (callEndedRef.current) return;
    callEndedRef.current = true;

    const duration = startTimeRef.current 
      ? (new Date().getTime() - startTimeRef.current.getTime()) / 1000 
      : 0;
    
    console.log(`📊 Interview duration: ${Math.round(duration)}s`);
    
    const isComplete = duration >= MIN_DURATION_FOR_COMPLETE;
    setCallStatus('ended');
    setCallResult(isComplete ? 'completed' : 'incomplete');
    
    if (isComplete) {
      setTimeout(() => onInterviewComplete('completed'), 3000);
    }
  }, [onInterviewComplete]);

  // Create widget only once on mount
  useEffect(() => {
    // Load widget script
    if (!document.querySelector('script[src*="convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      document.body.appendChild(script);
    }

    // Create widget element only once
    if (widgetContainerRef.current && !widgetCreatedRef.current) {
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      widget.setAttribute('dynamic-variables', dynamicVarsJson);
      widgetContainerRef.current.appendChild(widget);
      widgetCreatedRef.current = true;
    }

    const setupListeners = () => {
      const widget = document.querySelector('elevenlabs-convai');
      if (!widget) return;

      // Listen for call start
      widget.addEventListener('elevenlabs-convai:call', () => {
        console.log('📞 Call started');
        setCallStatus('active');
        startTimeRef.current = new Date();
        callEndedRef.current = false;
      });

      // Try multiple event names for call end
      const endEventNames = [
        'elevenlabs-convai:call-end',
        'elevenlabs-convai:call:end',
        'elevenlabs-convai:disconnect',
        'elevenlabs-convai:conversation-end',
        'elevenlabs-convai:ended',
      ];

      endEventNames.forEach(eventName => {
        widget.addEventListener(eventName, () => {
          console.log(`📞 Call ended via event: ${eventName}`);
          handleCallEnd();
        });
      });

      // Also listen on window/document for global events
      endEventNames.forEach(eventName => {
        window.addEventListener(eventName, () => {
          console.log(`📞 Call ended via window event: ${eventName}`);
          handleCallEnd();
        });
      });

      // Use MutationObserver to detect when widget shows "conversation ended" UI
      const observer = new MutationObserver((mutations) => {
        const widgetEl = document.querySelector('elevenlabs-convai');
        if (widgetEl) {
          // Check shadow DOM for end-of-call indicators
          const shadowRoot = (widgetEl as any).shadowRoot;
          if (shadowRoot) {
            const text = shadowRoot.textContent || '';
            if (text.includes('ended the conversation') || 
                text.includes('How was this conversation') ||
                text.includes('New call')) {
              console.log('📞 Call ended detected via MutationObserver');
              handleCallEnd();
            }
          }
        }
      });

      // Observe the widget for changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        characterData: true,
        attributes: true
      });

      // Cleanup observer on unmount
      return () => observer.disconnect();
    };

    // Try setting up listeners multiple times as widget loads async
    const timers = [
      setTimeout(setupListeners, 500),
      setTimeout(setupListeners, 1500),
      setTimeout(setupListeners, 3000),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [agentId, dynamicVarsJson, handleCallEnd]);

  const retryInterview = () => {
    setCallResult(null);
    setCallStatus('idle');
    startTimeRef.current = null;
    callEndedRef.current = false;
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

      {/* Widget container - widget is created once via useEffect, not re-rendered */}
      <div ref={widgetContainerRef} />

      {callStatus === 'idle' && (
        <p className="text-sm text-muted-foreground">
          💡 Find a quiet space. Interview takes 3-5 minutes.
        </p>
      )}
    </div>
  );
}
