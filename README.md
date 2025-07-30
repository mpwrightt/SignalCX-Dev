# SignalCX 📊

**AI-Powered Support Ticket Analytics & Team Management Platform**

SignalCX is a comprehensive web application that transforms support ticket data into actionable business insights using advanced AI analytics. Built for modern support teams, it provides predictive analytics, team management, and intelligent workflow automation to optimize customer support operations.

![SignalCX Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 📋 Development Progress

**Last Updated:** July 30, 2025 | **Project Status:** Active Development

### 📊 Overall Progress
```
Total Tasks: 20 (100 subtasks)
✅ Completed: 9 tasks (45 subtasks) - 45%
🔄 In Progress: 0 tasks (0 subtasks) - 0%
⏳ Pending: 11 tasks (55 subtasks) - 55%
```

### 🎯 High Priority Tasks

#### ✅ Completed
- [x] **#1** Setup Project Repository *(5/5 subtasks complete)*
- [x] **#2** Implement Supabase Authentication *(5/5 subtasks complete)*
- [x] **#3** Develop Role-Based Access Control *(5/5 subtasks complete)*
- [x] **#6** Develop Multi-Agent Analysis Feature *(5/5 subtasks complete)*
- [x] **#14** Integrate Supabase for Data Management *(5/5 subtasks complete)*
- [x] **#17** Develop Advanced Analytics Dashboard *(5/5 subtasks complete)*

#### ⏳ Pending (High Priority)
- [ ] **#7** Implement Predictive Forecasting *(0/5 subtasks complete)*
  - [ ] 7.1 Select AI Models for Forecasting
  - [ ] 7.2 Develop Forecasting Algorithm
  - [ ] 7.3 Calculate Confidence Intervals
  - [ ] 7.4 Integrate Forecasts into Dashboard
  - [ ] 7.5 Validate Forecasting System

- [ ] **#8** Integrate Sentiment Analysis *(0/5 subtasks complete)*
  - [ ] 8.1 Select AI Model for Sentiment Analysis
  - [ ] 8.2 Integrate AI Model into Ticket System
  - [ ] 8.3 Develop Dashboard for Sentiment Display
  - [ ] 8.4 Optimize Sentiment Analysis Performance
  - [ ] 8.5 Conduct Comprehensive Testing

- [ ] **#9** Develop Risk Assessment Feature *(0/5 subtasks complete)*
  - [ ] 9.1 Research AI Models for SLA Breach Prediction
  - [ ] 9.2 Develop SLA Breach Prediction Algorithm
  - [ ] 9.3 Identify At-Risk Tickets
  - [ ] 9.4 Integrate Risk Assessment into Dashboard
  - [ ] 9.5 Validate Risk Assessment Feature

- [ ] **#15** Implement PII Scrubbing *(0/5 subtasks complete)*
  - [ ] 15.1 Research PII Detection Techniques
  - [ ] 15.2 Develop PII Detection Module
  - [ ] 15.3 Design PII Scrubbing Algorithm
  - [ ] 15.4 Integrate PII Scrubbing with AI Processing
  - [ ] 15.5 Ensure Compliance with Data Privacy Standards

- [ ] **#18** Implement Real-time Metrics *(0/5 subtasks complete)*
  - [ ] 18.1 Design KPI Card Layout
  - [ ] 18.2 Integrate Recharts for Real-time Data
  - [ ] 18.3 Develop Trend Indicators
  - [ ] 18.4 Implement Drill-down Capabilities
  - [ ] 18.5 Validate Real-time Metrics and Drill-down

### 🔄 Medium Priority Tasks

#### ✅ Completed
- [x] **#4** Implement Team Management System *(5/5 subtasks complete)*
- [x] **#12** Implement Dual Data Modes *(5/5 subtasks complete)*
- [x] **#13** Develop AI Ticket Generation *(5/5 subtasks complete)*

#### ⏳ Pending (Medium Priority)
- [ ] **#5** Setup Organization Scoping *(0/5 subtasks complete)*
  - Dependencies: Task #4 (Team Management System)
  - Focus: Single-company security with application-layer data scoping

- [ ] **#10** Implement Coaching Insights *(0/5 subtasks complete)*
  - Dependencies: Task #6 (Multi-Agent Analysis Feature)
  - Focus: AI-generated agent coaching recommendations

- [ ] **#11** Develop Trend Analysis Feature *(0/5 subtasks complete)*
  - Dependencies: Task #6 (Multi-Agent Analysis Feature)
  - Focus: Automated trend detection and emerging issue identification

- [ ] **#16** Develop Data Classification System *(0/5 subtasks complete)*
  - Dependencies: Task #14 (Supabase Data Management)
  - Focus: Data sensitivity classification and access controls

- [ ] **#19** Develop Interactive Charts *(0/5 subtasks complete)*
  - Dependencies: Task #17 (Advanced Analytics Dashboard)
  - Focus: Recharts-powered visualizations with filtering and export options

- [ ] **#20** Implement Customizable Dashboard Layout *(0/5 subtasks complete)*
  - Dependencies: Task #17 (Advanced Analytics Dashboard)
  - Focus: Drag-and-drop dashboard customization with persistent layouts

### 🚀 Next Recommended Tasks
1. **Task #7** - Implement Predictive Forecasting (High Priority)
2. **Task #8** - Integrate Sentiment Analysis (High Priority)
3. **Task #15** - Implement PII Scrubbing (High Priority, Security Critical)

### 📈 Development Velocity
- **Sprint Focus:** AI-powered analytics and security features
- **Completed This Phase:** 9 major tasks with comprehensive subtask implementation
- **Upcoming Phase:** Predictive analytics, sentiment analysis, and security hardening


## ✨ Key Features

### 🤖 AI-Powered Analytics
- **Intelligent Dashboard** - Real-time analytics with AI-generated insights
- **Predictive Forecasting** - Volume prediction and resource planning
- **Risk Detection** - Identify tickets at risk of SLA breach or low CSAT
- **Sentiment Analysis** - Automated customer sentiment tracking
- **Smart Categorization** - AI-powered ticket classification

### 👥 Team Management
- **Role-Based Access Control** - Granular permissions system
- **Email Invitations** - Professional invitation system with SMTP integration
- **User Management** - Activate/deactivate team members
- **Organization Settings** - Multi-tenant architecture support
- **Audit Logging** - Complete activity tracking

### 📈 Advanced Analytics
- **Multi-Agent AI System** - Parallel processing with multiple AI models
- **Custom Reports** - Tailored analytics for different roles
- **Performance Metrics** - Agent and team performance tracking
- **Trend Analysis** - Historical and predictive trend identification
- **Executive Dashboards** - High-level insights for leadership

### 🔧 Integration & Automation
- **Zendesk Integration** - Direct API connection for live data
- **Google AI & Genkit** - Advanced AI model integration

- **Email Automation** - Automated notifications and invitations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 

- Google AI API key
- Gmail account (for SMTP)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mpwrightt/Signalcx.git
   cd Signalcx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   # Required - Google AI API Key
   GOOGLE_API_KEY=your_google_ai_key
   
   
   
   # Email Configuration (for invitations)
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your_gmail_app_password
   
   # Bootstrap Admin
   NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL=admin@yourcompany.com
   ```



5. **Start Development Servers**
   ```bash
   # Terminal 1 - Next.js App
   npm run dev
   
   # Terminal 2 - Genkit AI Server
   npm run genkit:dev
   ```

6. **Access the Application**
   - Web App: http://localhost:9002
   - Genkit UI: http://localhost:4000

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.3.3 with TypeScript
- **AI/ML**: Google AI, Genkit, LangChain

- **UI**: ShadCN UI components with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Email**: Nodemailer with Gmail SMTP
- **Testing**: Jest & React Testing Library

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   └── accept-invitation/ # Invitation acceptance
├── ai/                    # Genkit AI flows
│   ├── flows/            # Individual AI workflows
│   └── genkit.ts         # AI configuration
├── components/           # React components
│   ├── ui/              # Base UI components
│   └── dashboard/       # Dashboard-specific components
├── hooks/               # Custom React hooks
└── lib/                 # Utilities and services
    ├── auth-service.ts  # Authentication logic
    ├── team-service.ts  # Team management
    └── types.ts         # TypeScript definitions
```

## 🔐 Authentication & Security

### Authentication Flow
1. **Google OAuth** - Secure sign-in with Google accounts

3. **Role-Based Access** - Granular permission system
4. **Organization Scoping** - Multi-tenant data isolation

### Security Features

- **PII Scrubbing** - Automatic sensitive data removal
- **Audit Logging** - Complete activity tracking
- **Session Management** - Secure token handling

## 📊 Data Sources

### Zendesk Integration
- **Live Data Mode** - Real-time ticket synchronization
- **Demo Mode** - Sample data for testing
- **API Configuration** - Flexible connection settings

### Supported Data Types
- Support tickets with full metadata
- Customer interactions and history
- Agent performance metrics
- SLA and response time tracking

## 🤖 AI Capabilities

### Multi-Agent System
- **Analysis Agent** - Ticket categorization and sentiment
- **Prediction Agent** - Volume and risk forecasting  
- **Coaching Agent** - Performance insights
- **Synthesis Agent** - Executive summaries

### AI Models
- **Google Gemini** - Primary language model
- **Claude (Optional)** - Advanced reasoning tasks
- **GPT (Optional)** - Specialized analysis tasks

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start Next.js development server
npm run genkit:dev   # Start Genkit AI server
npm run genkit:watch # Start Genkit with file watching
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run test         # Run Jest tests
```

### Development Workflow
1. **Research** - Always start by understanding existing patterns
2. **Plan** - Propose approach and get approval
3. **Implement** - Build with tests and error handling
4. **Validate** - Run linters, type checks, and tests

## 🚢 Deployment

### Production Checklist

- [ ] Set up environment variables

- [ ] Configure email SMTP settings
- [ ] Set up monitoring and logging
- [ ] Run security audit

### Deployment Options
- **Vercel** - Recommended for Next.js applications

- **Custom Server** - Docker containerization support

## 📝 Team Management

### User Roles
- **Super Admin** - Global system administration
- **Organization Admin** - Full organization control
- **Manager** - Team oversight and reporting
- **Agent** - Ticket handling and basic analytics
- **Read Only** - View-only access to dashboards

### Invitation System
- Professional HTML email templates
- Secure token-based acceptance
- Automatic role assignment
- Expiration and revocation support

## 🔧 Configuration

### Environment Variables
See `.env.example` for complete configuration options including:
- AI API keys (Google, Anthropic, OpenAI)

- Zendesk integration settings
- Email SMTP configuration
- Application URLs and settings


- **Authentication** - Google OAuth integration  
- **Security Rules** - Role-based data access
- **Indexes** - Optimized query performance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/mpwrightt/Signalcx/issues)
- **Documentation**: Check the `/docs` directory
- **Email**: [Contact the team](mailto:support@signalcx.com)

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- UI components from [ShadCN UI](https://ui.shadcn.com)
- AI powered by [Google Genkit](https://firebase.google.com/docs/genkit)
- Charts by [Recharts](https://recharts.org)

---

**SignalCX** - Transforming support data into business intelligence 🚀# SignalCX-Dev
