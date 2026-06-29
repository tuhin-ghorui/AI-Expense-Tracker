import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Sparkles,
  User,
  GraduationCap,
  Building,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LogOut
} from 'lucide-react';

interface OnboardingWizardProps {
  user: any;
  onComplete: () => void;
}

const STUDENT_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  'Final Year (Senior)',
  'Postgraduate / Master\'s'
];

const HOUSING_TYPES = [
  'Paying Guest (PG)',
  'College Hostel',
  'Rented Flat / Apartment',
  'Living with Parents / Family'
];

const GOAL_OPTIONS = [
  '📈 Start SIP / Stock Investing',
  '💻 Save for Tech / Laptop',
  '🍜 Cut Down Food Ordering / Canteen',
  '🛡️ Build Emergency Student Fund',
  '✈️ Travel / Vacation Savings'
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [studentYear, setStudentYear] = useState(STUDENT_YEARS[0]);
  const [monthlyBudget, setMonthlyBudget] = useState('15000');
  const [housingType, setHousingType] = useState(HOUSING_TYPES[0]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([GOAL_OPTIONS[0]]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleFinish = async () => {
    setLoading(true);
    const parsedBudget = parseFloat(monthlyBudget);
    const budgetValue = !isNaN(parsedBudget) ? parsedBudget : 15000;

    const payload = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      monthly_budget: budgetValue,
      currency: 'INR',
      student_year: studentYear,
      housing_type: housingType,
      financial_goals: selectedGoals.join(', '),
      is_onboarded: true
    };

    try {
      // Direct Upsert Attempt
      const { error } = await supabase
        .from('profiles')
        .upsert(payload);

      if (error) {
        console.warn('Upsert error, trying update fallback:', error.message);
        // Fallback: update existing row
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            monthly_budget: budgetValue,
            currency: 'INR',
            student_year: studentYear,
            housing_type: housingType,
            financial_goals: selectedGoals.join(', '),
            is_onboarded: true
          })
          .eq('id', user.id);

        if (updateErr) {
          alert(`Database save alert: ${updateErr.message}. Please make sure you ran the SQL policies query in Supabase!`);
        }
      }
      onComplete();
    } catch (err: any) {
      console.error('Onboarding update exception:', err);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header & Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Student Profile Setup</h2>
              <p className="text-xs text-indigo-300">Step {step} of 3</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-xs flex items-center space-x-1"
              title="Logout / Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    s === step
                      ? 'bg-indigo-400 w-6'
                      : s < step
                      ? 'bg-emerald-400'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Identity & Academic Year */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-400" />
                <span>Let's get to know you!</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tell us your name and academic standing so your AI coach can personalize its advice.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Academic Year</span>
                </label>
                <select
                  value={studentYear}
                  onChange={(e) => setStudentYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {STUDENT_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <span>Next: Financial Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Finances & Living Situation */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <Building className="w-5 h-5 text-purple-400" />
                <span>Living & Allowance</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your monthly budget allowance and housing type for tailored spending insights.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Monthly Allowance / Budget Target (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="15000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Housing / Living Arrangement
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {HOUSING_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHousingType(type)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                        housingType === type
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{type}</span>
                      {housingType === type && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl flex items-center justify-center space-x-1 text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Next: Goals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Financial Goals & Interests */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>Goals & Interests</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your primary financial targets so your Gemini AI Coach gives targeted hacks!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Select All That Apply
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {GOAL_OPTIONS.map((goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                        active
                          ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{goal}</span>
                      {active && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl flex items-center justify-center space-x-1 text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-2/3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-semibold py-3 px-4 rounded-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete & Launch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
