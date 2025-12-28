import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RotateCcw, Send, Loader2, Sparkles, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ChatInterviewProps {
  roleTitle: string;
  roleDescription: string;
  interviewQuestions: readonly string[];
  userName?: string;
  applicationId: number;
  onInterviewComplete: (status: 'completed' | 'incomplete') => void;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const MIN_MESSAGES_FOR_COMPLETE = 6; // At least 3 back-and-forth exchanges

export function ChatInterview({ 
  roleTitle,
  roleDescription,
  interviewQuestions,
  userName,
  applicationId,
  onInterviewComplete 
}: ChatInterviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [interviewResult, setInterviewResult] = useState<'completed' | 'incomplete' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.interview.chat.useMutation({
    onSuccess: (data: any) => {
      const messageContent = typeof data.message === 'string' ? data.message : String(data.message);
      setMessages(prev => [...prev, { role: 'assistant', content: messageContent }]);
      setIsLoading(false);
      
      // Check if interview is complete (AI says goodbye or thanks)
      const lowerMessage = messageContent.toLowerCase();
      if (lowerMessage.includes('thank you for your time') || 
          lowerMessage.includes('that concludes') ||
          lowerMessage.includes('best of luck')) {
        handleInterviewEnd();
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to send message');
      setIsLoading(false);
    },
  });

  // Start interview with greeting
  useEffect(() => {
    const greeting = `Hello${userName ? ` ${userName}` : ''}! I'm Ehi, your AI interviewer from Vora.now. I'll be asking you a few questions about your experience as a ${roleTitle}. This should take about 5 minutes. Let's get started!\n\nFirst question: ${interviewQuestions[0]}`;
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [userName, roleTitle, interviewQuestions]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Build conversation history for AI
    const conversationHistory = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    conversationHistory.push({ role: 'user', content: userMessage });

    chatMutation.mutate({
      applicationId,
      message: userMessage,
      conversationHistory,
      roleTitle,
      roleDescription,
      interviewQuestions: interviewQuestions as string[],
    });
  };

  const handleInterviewEnd = () => {
    const isComplete = messages.length >= MIN_MESSAGES_FOR_COMPLETE;
    setInterviewEnded(true);
    setInterviewResult(isComplete ? 'completed' : 'incomplete');
    
    if (isComplete) {
      setTimeout(() => onInterviewComplete('completed'), 2000);
    }
  };

  const handleEndEarly = () => {
    const isComplete = messages.length >= MIN_MESSAGES_FOR_COMPLETE;
    setInterviewEnded(true);
    setInterviewResult(isComplete ? 'completed' : 'incomplete');
    
    if (isComplete) {
      setTimeout(() => onInterviewComplete('completed'), 2000);
    }
  };

  const retryInterview = () => {
    window.location.reload();
  };

  // Block copy-paste for anti-cheat
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Copy-paste is disabled during the interview');
  };

  if (interviewEnded && interviewResult) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        {interviewResult === 'completed' ? (
          <>
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-semibold text-emerald-700">Interview Complete!</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Great job! We'll review your responses and get back to you within 24-48 hours.
            </p>
          </>
        ) : (
          <>
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-amber-700">Interview Incomplete</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Please answer at least 3 questions to be considered.
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
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  msg.role === 'user'
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4 space-y-3">
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-xs text-emerald-700">
            Answer thoughtfully. Your responses are being evaluated.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your response..."
            className="resize-none"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleEndEarly}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              End
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
