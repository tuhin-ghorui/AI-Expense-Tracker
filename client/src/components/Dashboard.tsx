import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Sparkles,
  LogOut,
  PlusCircle,
  Trash2,
  DollarSign,
  PieChart,
  Calendar,
  TrendingUp,
  BrainCircuit,
  Award,
  Wallet
} from 'lucide-react';

interface Expense {
  id: number;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const CATEGORIES = [
  'Rent & Housing',
  'Groceries & Food',
  'Books & Study Materials',
  'Social & Fun',
  'Transport',
  'Utilities',
  'Personal & Misc'
];

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(500);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchExpenses(user.id);
      }
    });
  }, []);

  const fetchExpenses = async (userId: string) => {
    setLoadingExpenses(true);
    try {
      const res = await fetch(`http://localhost:5000/api/expenses/${userId}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amount: parseFloat(amount),
          category,
          description,
          date
        })
      });
      const data = await res.json();
      if (data.success) {
        setExpenses([data.data, ...expenses]);
        setAmount('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(expenses.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleFetchAiAdvice = async () => {
    if (expenses.length === 0) {
      alert('Please add some expenses first so Gemini AI can analyze your spending patterns!');
      return;
    }
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const res = await fetch('http://localhost:5000/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          expenses,
          monthlyBudget
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        alert('Failed to generate AI advice: ' + data.error);
      }
    } catch (err) {
      console.error('AI Coach error:', err);
      alert('Could not connect to AI Coach backend. Make sure http://localhost:5000 is running!');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Calculations
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const daysInMonth = 30;
  const currentDay = new Date().getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay);
  const dailyLimit = remainingBudget > 0 ? (remainingBudget / remainingDays).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Student Finance Coach
              </h1>
              <p className="text-xs text-slate-400">Powered by Google Gemini Pro</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Budget Target:</span>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-100 text-center focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-800/40 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 px-3 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Spent</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">${totalSpent.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Monthly Budget</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">${monthlyBudget.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
              <PieChart className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Remaining</p>
              <h3 className={`text-2xl font-bold mt-1 ${remainingBudget < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                ${remainingBudget.toFixed(2)}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              remainingBudget < 0
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Daily Safe Limit</p>
              <h3 className="text-2xl font-bold text-cyan-400 mt-1">${dailyLimit}/day</h3>
            </div>
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Left (Add & List), Right (AI Coach) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Add Expense Form */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <span>Log New Student Expense</span>
              </h2>

              <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="15.50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Textbooks or Campus Coffee"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5" />
                        <span>Add Expense Record</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Expenses List */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Recent Transactions</h2>
                <span className="text-xs text-slate-400">{expenses.length} items logged</span>
              </div>

              {loadingExpenses ? (
                <div className="py-8 text-center text-slate-500 text-sm">Loading transactions...</div>
              ) : expenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                  No expenses logged yet. Add your first record above!
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {expenses.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200">
                            {item.description || item.category}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                              {item.category}
                            </span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-base font-semibold text-slate-100">
                          -${Number(item.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Gemini AI Financial Coach */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <BrainCircuit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">AI Financial Coach</h2>
                    <p className="text-xs text-indigo-300">Google Gemini Pro Analysis</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Get instant, personalized student budgeting strategies, spending habits breakdown, and tailored saving tricks tailored for your lifestyle.
              </p>

              <button
                onClick={handleFetchAiAdvice}
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-semibold py-3 px-4 rounded-xl shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {aiLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Gemini AI is analyzing...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate AI Financial Insights</span>
                  </>
                )}
              </button>

              {/* AI Analysis Result */}
              {aiAnalysis && (
                <div className="mt-6 bg-slate-950/80 border border-indigo-500/20 rounded-xl p-5 space-y-3 max-h-[500px] overflow-y-auto">
                  <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm border-b border-slate-800 pb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Coach Advice & Recommendations</span>
                  </div>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {aiAnalysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
