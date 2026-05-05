# Context Vault

**Context Vault** is a production-grade SaaS platform designed to solve "Context Drift" in AI-driven development. It acts as a portable, versioned memory layer for your projects, allowing you to maintain a consistent source of truth across multiple AI tools like ChatGPT, Claude, Cursor, and Windsurf.

---

## 🚀 Key Features

- **Project Vaults**: Create dedicated, secure storage for each of your codebases.
- **AI-Powered Extraction**: Paste session notes or raw handoffs, and our AI (Gemini) automatically extracts project goals, tech stacks, decisions, and next steps.
- **Versioned History**: Track how your project evolves over time with a structured version timeline.
- **Context Merging**: Intelligently merges new session updates into existing project memory without duplicating or losing data.
- **Multi-Model Export**: Generate clean, optimized context prompts tailored for specific AI models (Claude, ChatGPT, Cursor, etc.).
- **Visual Version Comparison**: Compare any two snapshots to see exactly what changed in your project's context.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4 (Vanilla CSS variables for theme management)
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js (Express)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **AI Engine**: Google Gemini Pro 1.5
- **Authentication**: JWT (JSON Web Tokens)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Context-Vault
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in `server/`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/context_vault"
   JWT_SECRET="your_secret_key"
   GEMINI_API_KEY="your_gemini_api_key"
   PORT=3000
   ```
   Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```
   Create a `.env` file in `client/`:
   ```env
   VITE_API_URL="http://localhost:3000/api"
   ```

### Running Locally

- **Start Backend**: `cd server && npm run dev`
- **Start Frontend**: `cd client && npm run dev`

---

## 🛡️ Security & Performance

- **Cascase Deletion**: Securely removes project data and history across all tables.
- **Exponential Backoff**: Robust AI retry logic and fallback model support for high reliability.
- **Independently Scrollable Layout**: Optimized UI for handling large project histories and complex diffs.
- **Production-Grade**: Built with strict TypeScript validation (Zod) across both the API and UI layers.

---

## 📄 License

This project is licensed under the MIT License.
