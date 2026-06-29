import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { OnboardingWizard } from './components/OnboardingWizard';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkOnboardingStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkOnboardingStatus(session.user.id);
      } else {
        setIsOnboarded(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboardingStatus = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch warning:', error.message);
      }

      if (data) {
        // If is_onboarded is explicitly true, or if student_year/housing_type exists
        if (data.is_onboarded === true || (data.student_year && data.housing_type)) {
          setIsOnboarded(true);
        } else if (data.is_onboarded === false) {
          setIsOnboarded(false);
        } else {
          // Default to true if profile exists to prevent blocking existing users
          setIsOnboarded(true);
        }
      } else {
        setIsOnboarded(false);
      }
    } catch (err) {
      console.error('Check onboarding status error:', err);
      setIsOnboarded(true); // Fallback to true on unexpected error so user isn't stuck
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <span>Loading student session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
        <Auth onAuthSuccess={() => {}} />
      </div>
    );
  }

  if (isOnboarded === false) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
        <OnboardingWizard user={session.user} onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
      <Dashboard />
    </div>
  );
}

export default App;
