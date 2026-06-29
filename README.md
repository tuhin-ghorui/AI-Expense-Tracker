# 🎓 AI Student Expense Tracker

An intelligent personal finance companion designed specifically for students. This application goes beyond simple expense tracking by leveraging **Google Gemini Pro AI** to act as a financial coach, suggesting effective ways to manage and optimize student budgets.

## ✨ Key Features

- **📊 Smart Tracking**: Log expenses across categories tailored for student life (Rent, Food, Study Materials, Social, etc.).
- **🤖 AI Financial Coach**: Get personalized spending insights and actionable tips on how to save money using Google Gemini AI.
- **📉 Budget Visualization**: Visual representation of spending patterns through intuitive charts and dashboards.
- **🎯 Goal Setting**: Set savings goals and let the AI calculate the daily spending limit needed to reach them.
- **📱 Mobile-First Design**: Built as a Progressive Web App (PWA) for seamless use across devices.

## 🛠️ Tech Stack

### Frontend
- **React.js** (with Vite)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (for data visualization)

### Backend
- **Node.js** & **Express**
- **Google Gemini Pro API** (AI Engine)
- **Supabase** (PostgreSQL Database & Authentication)

### Infrastructure
- **Capacitor.js** (for future conversion to Android/iOS apps)
- **GitHub Actions** (CI/CD)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google AI Studio account (for Gemini API Key)
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tuhin-ghorui/AI-Expense-Tracker.git
   cd AI-Expense-Tracker
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env # Create and fill in your API keys
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   cp .env.example .env # Create and fill in your Supabase keys
   npm run dev
   ```

## 🗺️ Project Roadmap

- [ ] **Phase 1: Foundation** (Auth, CRUD Expenses, Basic Dashboard)
- [ ] **Phase 2: AI Integration** (Gemini API connection, Basic Spend Analysis)
- [ ] **Phase 3: Advanced Insights** (Predictive budgeting, Category-specific AI coaching)
- [ ] **Phase 4: Mobile Optimization** (PWA setup, Capacitor wrapping for Play Store/App Store)
- [ ] **Phase 5: Multimodal Features** (AI Receipt scanning via Gemini Vision)

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
