import { useEffect } from 'react';

interface ElevenLabsWidgetProps {
  agentId: string;
  roleTitle: string;
  roleDescription: string;
  interviewQuestions: readonly string[];
  onCallEnd?: () => void;
}

export function ElevenLabsWidget({ 
  agentId, 
  roleTitle, 
  roleDescription, 
  interviewQuestions,
  onCallEnd 
}: ElevenLabsWidgetProps) {
  
  // Prepare dynamic variables for the agent
  const dynamicVariables = {
    role_title: roleTitle,
    role_description: roleDescription,
    interview_questions: interviewQuestions.join('\n'),
  };
  useEffect(() => {
    // Load the widget script if not already loaded
    if (!document.querySelector('script[src*="convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    // Listen for widget events
    const handleCallEnd = (event: any) => {
      console.log('📞 Call ended', event.detail);
      if (onCallEnd) {
        onCallEnd();
      }
    };

    const widget = document.querySelector('elevenlabs-convai');
    if (widget) {
      widget.addEventListener('elevenlabs-convai:end', handleCallEnd);
    }

    return () => {
      if (widget) {
        widget.removeEventListener('elevenlabs-convai:end', handleCallEnd);
      }
    };
  }, [agentId, onCallEnd]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold">Voice Interview with Ehi</h3>
        <p className="text-muted-foreground max-w-md">
          Click the microphone button below to start your interview. Speak naturally and answer Ehi's questions about your experience.
        </p>
      </div>

      {/* ElevenLabs Widget with Vora branding */}
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <elevenlabs-convai
              agent-id="${agentId}"
              variant="expanded"
              avatar-orb-color-1="#6DB035"
              avatar-orb-color-2="#4A9025"
              action-text="Start Interview"
              start-call-text="Begin Interview"
              end-call-text="End Interview"
              listening-text="Listening to your response..."
              speaking-text="Ehi is speaking..."
              dynamic-variables='${JSON.stringify(dynamicVariables)}'
            ></elevenlabs-convai>
          `,
        }}
      />

      <div className="text-sm text-muted-foreground text-center max-w-md">
        <p>💡 Tip: Find a quiet space and speak clearly. The interview typically takes 3-5 minutes.</p>
      </div>
    </div>
  );
}
