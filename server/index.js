require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Initialize Google Gemini AI Client
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY missing in .env');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AI Student Expense Tracker API Server is Running!',
    endpoints: {
      health: '/api/health',
      expenses: '/api/expenses/:userId',
      goals: '/api/goals/:userId',
      aiCoach: '/api/ai/coach (POST)'
    }
  });
});

// =========================================
// HEALTH CHECK ENDPOINT
// =========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!supabaseUrl,
      gemini: !!geminiApiKey
    }
  });
});

// =========================================
// EXPENSES API ENDPOINTS
// =========================================

// GET /api/expenses/:userId - Fetch expenses for a specific user
app.get('/api/expenses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching expenses:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses - Add a new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { user_id, amount, category, description, date } = req.body;

    if (!user_id || !amount || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, amount, and category are required.'
      });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          user_id,
          amount: parseFloat(amount),
          category,
          description: description || '',
          date: date || new Date().toISOString().split('T')[0]
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error adding expense:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/expenses/:id - Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================
// BUDGET GOALS API ENDPOINTS
// =========================================

// GET /api/goals/:userId - Fetch budget goals for a user
app.get('/api/goals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('budget_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching budget goals:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/goals - Add a budget goal
app.post('/api/goals', async (req, res) => {
  try {
    const { user_id, goal_name, target_amount, current_amount, deadline } = req.body;

    if (!user_id || !goal_name || !target_amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, goal_name, and target_amount are required.'
      });
    }

    const { data, error } = await supabase
      .from('budget_goals')
      .insert([
        {
          user_id,
          goal_name,
          target_amount: parseFloat(target_amount),
          current_amount: current_amount ? parseFloat(current_amount) : 0.00,
          deadline: deadline || null
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error adding budget goal:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================
// AI FINANCIAL COACH ENDPOINT (GEMINI PRO)
// =========================================
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { userId, expenses, monthlyBudget } = req.body;

    if (!expenses || !Array.isArray(expenses)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of expenses.'
      });
    }

    // Calculate spending summary
    const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const categoryBreakdown = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const prompt = `
You are a friendly, punchy AI Financial Coach for an Indian college student. Keep your advice short, sweet, encouraging, and highly personal (maximum 150 words total). Use Indian Rupees (₹) for all currency values and relate tips to Indian student life (e.g., PG/hostel, mess/canteen, metro/auto, stationery). Avoid long intros.

Student Snapshot:
- Monthly Budget: ₹${monthlyBudget || 15000}
- Total Spent: ₹${totalSpent.toFixed(2)}
- Category Breakdown: ${JSON.stringify(categoryBreakdown)}
- Recent Items Logged: ${JSON.stringify(expenses.slice(0, 5).map(e => `${e.description || e.category}: ₹${e.amount}`))}

Provide a crisp Markdown output with exactly these 3 concise sections:
👋 **Personal Snapshot**: 1 short friendly sentence reacting directly to what they spent on in ₹.
💡 **Quick Indian Student Hacks (2 Punchy Bullets)**: Super specific savings tips directly related to their top spent categories.
🎯 **Daily Target**: 1 clear sentence giving their suggested daily spending cap in ₹ to stay on budget.
`;

    // Try modern models in order of speed & recommendation with retries
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-pro'];
    let responseText = '';
    let lastError = null;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          responseText = response.text();
          if (responseText) {
            console.log(`Successfully generated AI insights using model: ${modelName}`);
            break;
          }
        } catch (err) {
          console.warn(`Model ${modelName} (attempt ${attempt}) failed: ${err.message}`);
          lastError = err;
          // If service unavailable or rate limited, wait a moment before retry/next model
          if (err.message.includes('503') || err.message.includes('429')) {
            await sleep(1200);
          } else {
            break; // Don't retry non-transient errors on the same model
          }
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      let friendlyError = lastError?.message || 'Unknown generative error';
      if (friendlyError.includes('503') || friendlyError.includes('429')) {
        friendlyError = 'Google Gemini AI servers are currently experiencing high demand or rate limits. Please wait 10-20 seconds and click Generate AI Financial Insights again!';
      }
      return res.status(503).json({
        success: false,
        error: friendlyError
      });
    }

    // Optionally save suggestion to Supabase if userId is present
    if (userId) {
      await supabase.from('ai_suggestions').insert([
        {
          user_id: userId,
          suggestion_text: responseText,
          category: 'General AI Coaching'
        }
      ]);
    }

    res.json({
      success: true,
      analysis: responseText,
      summary: {
        totalSpent,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error generating AI coaching:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI financial advice: ' + error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
