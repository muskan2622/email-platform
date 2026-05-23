# 📧 Email Platform - Automation & Workflow Engine

A powerful, real-time email automation platform built with **Next.js**, **Supabase**, **Prisma**, and **React Flow**. Design complex email workflows with visual orchestration, real-time event processing, and comprehensive execution debugging.

![Email Platform](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)

## 🌟 Features

### Automation & Workflow Management
- **Visual Workflow Builder** - Drag-and-drop automation canvas with real-time feedback
- **Rule Engine** - Complex conditional logic with nested AND/OR support
- **Event Orchestration** - Real-time event triggering and processing
- **Frequency Capping** - Per-user and global delivery limits
- **Scheduled Delivery** - Configurable delays and send windows

### Template System
- **Dynamic Email Templates** - Handlebars-based template rendering
- **Template Management** - CRUD operations with version control
- **Preview & Testing** - Real-time template preview with sample data
- **Provider Integration** - Multiple email service provider support

### Observability & Debugging
- **Execution Debugger** - Step-through workflow execution logs
- **Event Replay Simulator** - Replay events for testing and validation
- **Real-time Activity Feed** - Live workflow event monitoring
- **Performance Metrics** - Execution timing and success rates

### Platform Features
- **Dashboard** - Comprehensive metrics and activity overview
- **User Management** - Multi-user workspace support
- **AI Assistant** - Context-aware automation recommendations
- **Dark/Light Theme** - Responsive theme switching
- **Mobile Optimized** - Works seamlessly on all devices

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Automation  │  │  Templates   │      │
│  │              │  │  Builder     │  │  Manager     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Automations │  │  Workflows   │  │  Templates   │      │
│  │  API         │  │  API         │  │  API         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│              Business Logic & Workflow Engine                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Rule Engine │ Event Processor │ Template Renderer │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│              Database & External Services                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  PostgreSQL  │  │  Email       │      │
│  │  (Auth)      │  │  (Prisma ORM)│  │  Providers   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.17+
- **npm** or **pnpm**
- **Supabase** account (database and auth)
- **Git** configured

### Installation

```bash
# Clone the repository
git clone https://github.com/muskan2622/email-platform.git
cd email-platform

# Install dependencies
npm install
# or
pnpm install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Setup

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_platform"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email Providers
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"

# AI Features (Optional)
OPENAI_API_KEY="your-openai-key"
```

## 📁 Project Structure

```
email-platform/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── automations/          # Automation CRUD
│   │   ├── workflows/            # Workflow execution
│   │   ├── templates/            # Template management
│   │   └── events/               # Event processing
│   ├── (workspace)/              # Main workspace layout
│   │   ├── dashboard/            # Dashboard page
│   │   ├── rules/                # Automation rules
│   │   ├── templates/            # Templates page
│   │   ├── events/               # Events page
│   │   └── logs/                 # Email logs page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── automation-builder/       # Automation wizard
│   ├── rules/                    # Workflow canvas & visualization
│   ├── templates/                # Template editor
│   ├── dashboard/                # Dashboard components
│   ├── ui/                       # Reusable UI components
│   └── motion/                   # Animation effects
│
├── lib/                          # Core utilities & logic
│   ├── workflow/                 # Workflow engine
│   ├── automation/               # Automation logic
│   ├── email/                    # Email utilities
│   ├── engine/                   # Rule engine
│   ├── ai/                       # AI features
│   └── api/                      # API client
│
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema
│
├── supabase/                     # Supabase configuration
│   ├── config.toml               # Supabase config
│   └── migrations/               # SQL migrations
│
├── docs/                         # Documentation
│   ├── AUTOMATION_BUILDER.md     # Builder guide
│   ├── WORKFLOW_RULE_ENGINE.md   # Engine docs
│   └── TEMPLATE_MANAGEMENT_SYSTEM.md
│
└── package.json                  # Dependencies
```

## 🔄 Workflow Execution Flow

```
Event Received
     ↓
Trigger Validation
     ↓
Condition Evaluation (AND/OR logic)
     ↓
Frequency Cap Check
     ↓
Schedule Delay Processing
     ↓
Template Rendering
     ↓
Email Send (via provider)
     ↓
Goal Tracking
     ↓
Execution Logged
```

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run type-check

# Database
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Create migration
npx prisma generate        # Generate Prisma client
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 📦 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **Visualization** | React Flow |
| **Database** | Supabase, PostgreSQL, Prisma ORM |
| **Authentication** | Supabase Auth |
| **State Management** | React Hooks, Context API |
| **API** | Next.js API Routes, REST |
| **Email** | SMTP, Email Service Providers |
| **AI** | OpenAI API (optional) |
| **Deployment** | Vercel |

## 🚀 Deployment

### Deploy to Vercel

The easiest deployment option:

```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Deploy via Vercel CLI
npm i -g vercel
vercel

# Or connect via Vercel dashboard
# 1. Push code to GitHub
# 2. Import project in Vercel
# 3. Set environment variables
# 4. Deploy
```

**Environment Variables for Vercel:**
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `OPENAI_API_KEY` (optional)

### Vercel Configuration

The project includes `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]
}
```

## 📚 Documentation

- **[Automation Builder Guide](./docs/AUTOMATION_BUILDER.md)** - How to create and manage automations
- **[Workflow Rule Engine](./docs/WORKFLOW_RULE_ENGINE.md)** - Rule engine documentation
- **[Template Management System](./docs/TEMPLATE_MANAGEMENT_SYSTEM.md)** - Template system guide
- **[Backend Architecture](./docs/BACKEND.md)** - Backend implementation details

## 🧪 Testing

```bash
# Run tests (when test suite is set up)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset Prisma
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Build Errors
```bash
# Clear build cache
rm -rf .next

# Rebuild
npm run build
```

### Missing Environment Variables
```bash
# Verify all required env vars
cat .env.local

# Copy from example
cp .env.example .env.local
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Muskan Singh** - [@muskan2622](https://github.com/muskan2622)
- **Cursor Agent** - AI Assistant

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Open-source Firebase alternative
- [React Flow](https://reactflow.dev) - Visual workflow builder
- [Framer Motion](https://www.framer.com/motion) - Animation library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Prisma](https://www.prisma.io) - ORM for Node.js

## 📞 Support

For support, email support@emailplatform.com or open an issue on GitHub.

## 🔗 Links

- **Live Demo**: [email-platform.vercel.app](https://email-platform.vercel.app)
- **GitHub**: [github.com/muskan2622/email-platform](https://github.com/muskan2622/email-platform)
- **Documentation**: [docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/muskan2622/email-platform/issues)

---

**Made with ❤️ by the AppCrafters team**
