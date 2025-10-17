# Outreach Studio 🚀

<div align="center">

**AI-Powered Email Follow-Up Automation**

*Intelligent outreach that maintains your brand voice and actually gets replies*

> **Note**: This repository is named `project-loom` for internal purposes, but the product is branded as **Outreach Studio**.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 20+](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

📸 **Screenshots coming soon** - app is live and functional!

</div>

---

## 📖 Overview

**Outreach Studio** is an AI-powered email automation platform designed to help teams scale their outreach without losing the human touch. With intelligent follow-ups, brand voice management, and advanced sequence building, Outreach Studio ensures your emails stay personal, timely, and effective.

### Why Outreach Studio?

- **🎯 Smart, Not Spammy**: AI-generated follow-ups that match your brand voice and context
- **🔄 Reply-Aware**: Automatically detects responses and stops sequences to prevent over-messaging
- **📊 Data-Driven**: Real-time analytics show what's working and suggest improvements
- **🎨 Voice Studio**: Manage multiple brand voices and maintain consistency across all communications
- **🚀 Production-Ready**: Built with enterprise-grade tools and best practices

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📧 Email Automation

- **✉️ AI Follow-Up Generation**
  GPT-4 powered drafts that understand context and tone

- **📧 Multi-Step Sequences**
  Build complex campaigns with custom delays and conditions

- **🎨 Voice Studio**
  Manage multiple brand voices with personality profiles

- **📚 Pre-Built Templates**
  Quick-start templates for common outreach scenarios

- **👁️ Email Preview**
  Gmail/Outlook-style preview before sending

### 💡 Intelligence & Insights

- **🔄 Reply Detection**
  Automatic reply tracking with sequence stopping

- **📊 Analytics Dashboard**
  Performance metrics, reply rates, and trend analysis

- **💡 AI Insights**
  Smart recommendations for improving engagement

- **📈 Visual Reports**
  Interactive charts powered by Recharts

</td>
<td width="50%" valign="top">

### 🛠️ Developer Experience

- **⚡ Fast Development**
  Hot reload for both frontend and backend

- **🎯 Type Safety**
  Full TypeScript support with strict mode

- **📝 API Documentation**
  Auto-generated OpenAPI docs at `/docs`

- **🧪 Test Simulation**
  Built-in tools to test reply detection without real emails

- **🏗️ Monorepo Structure**
  Organized workspace with pnpm + Turbo

### ⚙️ Settings & Customization

- **🔧 Flexible Configuration**
  API keys, email signatures, notification preferences

- **🎭 Brand Voice Management**
  Switch between different brand personalities instantly

- **🔗 Email Provider Support**
  Resend API (primary), Gmail OAuth (planned)

- **🌙 Dark Mode Support**
  Full dark mode throughout the application

</td>
</tr>
</table>

---

## 📸 Screenshots

> 📸 **Note**: Screenshots are being prepared. The application is fully functional and you can run it locally following the [Getting Started](#-getting-started) guide below.

### Dashboard Overview
![Dashboard](docs/screenshots/dashboard.png)

*Main dashboard showing follow-up jobs, quick stats, and recent activity. Provides at-a-glance view of your outreach performance.*

### Email Composer with AI Generation
![Email Composer](docs/screenshots/composer.png)

*Intelligent email composer with AI-powered draft generation. Features brand voice selection, tone customization, and real-time preview.*

### Email Preview Modal
![Email Preview Modal](docs/screenshots/email-preview.png)

*Gmail/Outlook-style email preview showing exactly how your email will appear in the recipient's inbox before sending.*

### Multi-Step Sequences
![Sequences](docs/screenshots/sequences.png)

*Visual sequence builder for creating multi-touch email campaigns. Drag-and-drop interface with conditional logic and automatic reply detection.*

### Analytics Dashboard
![Analytics](docs/screenshots/analytics.png)

*Comprehensive analytics dashboard with reply rates, engagement trends, and AI-powered insights. Real-time charts powered by Recharts.*

### Voice Studio
![Voice Studio](docs/screenshots/voice-studio.png)

*Brand voice management system. Create and maintain multiple brand personalities with custom tone attributes and example phrases.*

---

## 🌐 Live Demo

> 🚀 **Coming Soon**: A hosted demo instance will be available at `demo.outreach.studio`

For now, you can run the application locally by following the [Getting Started](#-getting-started) guide below. The setup takes ~5 minutes!

**Quick Start:**
```bash
# Clone and install
git clone https://github.com/beautifulgownss/project-loom.git
cd project-loom && pnpm install

# Set up environment variables and run
# See detailed instructions in Getting Started section
```

---

## 🛠️ Tech Stack

### Frontend
```
Next.js 14 (App Router) | React 18 | TypeScript 5
TailwindCSS 3 | Recharts | Headless UI
```

### Backend
```
FastAPI | Python 3.11+ | Pydantic v2
SQLAlchemy 2.0 | SQLite/PostgreSQL
OpenAI API (GPT-4) | Resend API
```

### Infrastructure
```
pnpm Workspaces | Turbo (monorepo)
Redis/Upstash (background jobs)
Docker (deployment ready)
```

---

## 📁 Project Structure

```
project-loom/
├── apps/
│   ├── web/                  # Next.js frontend (port 3000)
│   │   ├── app/             # App router pages
│   │   │   ├── composer/    # Email composer
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── sequences/   # Sequence builder
│   │   │   ├── analytics/   # Analytics & insights
│   │   │   ├── replies/     # Reply management
│   │   │   ├── settings/    # User settings
│   │   │   └── test/        # Testing tools
│   │   └── lib/             # API client, utilities
│   │
│   └── api/                  # FastAPI backend (port 8000)
│       ├── app/
│       │   ├── core/        # Config, database, deps
│       │   ├── models/      # SQLAlchemy models
│       │   ├── routes/      # API endpoints
│       │   ├── schemas/     # Pydantic schemas
│       │   └── services/    # Business logic
│       ├── worker.py        # Background job processor
│       └── main.py          # FastAPI app
│
├── packages/                 # Shared packages (future)
│   ├── ui/                  # Shared React components
│   └── config/              # Shared configs
│
└── docs/                    # Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm** 8+
- **Python** 3.11+
- **OpenAI API Key** (for AI features)
- **Resend API Key** (for email sending)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/beautifulgownss/project-loom.git
   cd project-loom
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Install backend dependencies**
   ```bash
   cd apps/api
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   **Frontend** (`apps/web/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/v1
   ```

   **Backend** (`apps/api/.env`):
   ```env
   # Database
   DATABASE_URL=sqlite:///./project_loom.db
   # For PostgreSQL: postgresql://user:password@localhost/project_loom

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Resend
   RESEND_API_KEY=re_...

   # Security
   SECRET_KEY=your-secret-key-here

   # CORS
   CORS_ORIGINS=http://localhost:3000
   ```

5. **Initialize the database**
   ```bash
   cd apps/api
   source .venv/bin/activate
   python init_db.py
   ```

6. **Run the application**

   **Terminal 1 - Backend API:**
   ```bash
   cd apps/api
   source .venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

   **Terminal 2 - Background Worker:**
   ```bash
   cd apps/api
   source .venv/bin/activate
   python worker.py
   ```

   **Terminal 3 - Frontend:**
   ```bash
   cd apps/web
   pnpm dev
   ```

7. **Open your browser**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/v1/docs

---

## 💡 Usage

### Creating Your First Follow-Up

1. **Navigate to Composer** (`/composer`)
2. Fill in recipient details and original email
3. Configure follow-up settings (delay, tone, max follow-ups)
4. Click "Generate Draft" to create AI-powered follow-up
5. Review and schedule or send immediately

### Building Email Sequences

1. **Go to Sequences** (`/sequences`)
2. Click "Create New Sequence"
3. Add multiple steps with custom delays and tones
4. Set reply detection rules
5. Enroll recipients and let automation handle the rest

### Monitoring Performance

1. **Visit Analytics** (`/analytics`)
2. View overview metrics (reply rate, avg response time)
3. Explore trends over time
4. Get AI-powered insights and recommendations

### Testing Reply Detection

1. **Go to Test Simulation** (`/test/simulate-reply`)
2. Select a sent follow-up
3. Enter mock reply content
4. See the system update status and stop sequences

---

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/v1/docs
- **ReDoc**: http://localhost:8000/v1/redoc

### Key Endpoints

```
POST   /v1/followups              Create follow-up job
GET    /v1/followups              List all follow-ups
POST   /v1/followups/{id}/send-now Send immediately

POST   /v1/sequences              Create sequence
POST   /v1/sequences/{id}/start   Enroll recipient

GET    /v1/replies                List all replies
POST   /v1/test/simulate-reply    Simulate reply (testing)

GET    /v1/analytics/overview     Get metrics
GET    /v1/analytics/trends       Get trends
GET    /v1/analytics/insights     Get AI insights

POST   /v1/ai/generate            Generate AI draft
```

---

## 🗺️ Roadmap

### ✅ Completed (v0.1)
- [x] AI-powered follow-up generation
- [x] Multi-step email sequences
- [x] 15 pre-built templates
- [x] Analytics dashboard with charts
- [x] Reply detection system
- [x] Settings & brand voice
- [x] Background worker
- [x] Test simulation tools

### 🚧 In Progress (v0.2)
- [ ] User authentication (Clerk/Supabase)
- [ ] Real webhook handlers (Resend/Gmail)
- [ ] Email verification workflow
- [ ] Team collaboration features
- [ ] Advanced sequence conditions

### 📋 Planned (v0.3+)
- [ ] **Brand & Content Module**
  - Brand asset library
  - Content templates
  - Style guide management
- [ ] **Advanced Analytics**
  - A/B testing
  - Cohort analysis
  - Predictive insights
- [ ] **Integrations**
  - CRM sync (Salesforce, HubSpot)
  - Calendar integration
  - Slack notifications
- [ ] **Enterprise Features**
  - SSO/SAML
  - Advanced permissions
  - Audit logs
  - Custom workflows

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Outreach Studio Team**

- GitHub: [@beautifulgownss](https://github.com/beautifulgownss)
- Website: [Coming Soon]

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Vercel for Next.js
- FastAPI team for the amazing framework
- The open-source community

---

<div align="center">

*Star ⭐ this repo if you find it helpful!*

</div>
