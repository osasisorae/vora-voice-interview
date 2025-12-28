import { useParams, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, Mic, Loader2 } from 'lucide-react';
import { EVENT_ROLES } from '../../../shared/roles';
import { ElevenLabsWidget } from '../components/ElevenLabsWidget';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

export default function RoleApplication() {
  const { roleId } = useParams<{ roleId: string }>();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'auth' | 'intro' | 'interview' | 'complete'>('auth');
  const { user, loading: authLoading } = useAuth();
  
  const role = EVENT_ROLES.find(r => r.id === roleId);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const createApplication = trpc.roleApplications.create.useMutation({
    onSuccess: (data: any) => {
      setStep('interview');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to start application');
    },
  });
  
  // Set return URL cookie and redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user && step === 'auth') {
      // Store current URL in cookie for redirect after login
      document.cookie = `vora_return_url=${window.location.pathname}; path=/; max-age=3600`;
      // Redirect to Manus OAuth
      window.location.href = getLoginUrl();
    } else if (!authLoading && user && step === 'auth') {
      // User is authenticated, move to intro
      setStep('intro');
    }
  }, [authLoading, user, step]);
  
  // Show loading while checking auth
  if (authLoading || (!user && step === 'auth')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  const handleStartInterview = () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    
    createApplication.mutate({
      roleId: roleId!,
    });
  };
  
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Role Not Found</CardTitle>
            <CardDescription>The role you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/roles')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-emerald-50">
        <Card className="max-w-2xl mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              Thanks for applying as a {role.title}. We'll review your interview and get back to you within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>What's next?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Our team will review your voice interview</li>
                  <li>If approved, you'll be added to our {role.title} talent pool</li>
                  <li>You'll get notified when gigs matching your role become available</li>
                  <li>Check your email for updates</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button onClick={() => setLocation('/roles')} variant="outline" className="flex-1">
                Apply for Another Role
              </Button>
              <Button onClick={() => setLocation('/')} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (step === 'interview' && createApplication.data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            onClick={() => setStep('intro')} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Voice Interview: {role.title}</CardTitle>
              <CardDescription>
                Speak with Ehi about your {role.title} experience. The interview takes about 5 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ElevenLabsWidget
                agentId={import.meta.env.VITE_ELEVENLABS_AGENT_ID}
                roleTitle={role.title}
                roleDescription={role.description}
                interviewQuestions={role.interviewQuestions}
                onCallEnd={() => {
                  // Interview completed
                  setStep('complete');
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Intro step
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button 
          onClick={() => setLocation('/roles')} 
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roles
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{role.icon}</div>
              <div>
                <CardTitle className="text-3xl">{role.title}</CardTitle>
                <CardDescription className="text-base">{role.description}</CardDescription>
              </div>
            </div>
            <Badge className="w-fit bg-emerald-100 text-emerald-700">
              <Mic className="h-3 w-3 mr-1" />
              Voice Interview Required
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Show logged in user info */}
            {user && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Signed in as:</strong> {user.name || user.email}
                </p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-3">What to Expect</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-emerald-700">1</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Voice Interview with Ehi</strong>
                    <p>You'll have a natural conversation with our AI recruiter about your {role.title} experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-emerald-700">2</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">5 Questions</strong>
                    <p>Answer questions about your skills, experience, and availability (takes ~5 minutes)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-emerald-700">3</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Get Reviewed</strong>
                    <p>Our team reviews your interview and adds you to the talent pool if approved</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Sample Questions You'll Be Asked:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {role.interviewQuestions.slice(0, 3).map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 flex-shrink-0">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Before you start:</strong> Make sure you're in a quiet place with a good internet connection. 
                You'll need to allow microphone access for the voice interview.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleStartInterview}
              disabled={createApplication.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
            >
              {createApplication.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Voice Interview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
