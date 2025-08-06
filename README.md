# Billux 💎

**The Open-Source German Invoice Management Revolution**

> ⚠️ **Development Status**: Billux is currently in active development and is not yet production-ready. Features are being actively developed and tested. Use at your own risk for production environments.

[![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.2-purple?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-teal?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🇩🇪 **The modern, open-source alternative to SevDesk and Lexoffice**  
> Built for German businesses with ZuGFERD compliance, AI-powered features, and enterprise-grade architecture.

## 🎯 Why Billux?

Traditional German accounting software locks you into expensive subscriptions and proprietary systems. **Billux** breaks free from this model, offering a powerful, self-hosted solution that puts you in complete control of your business data.

### 🆚 **vs. SevDesk & Lexoffice**

| Feature | Billux | SevDesk/Lexoffice |
|---------|------------------|-------------------|
| **🔓 Open Source** | ✅ Full transparency | ❌ Proprietary |
| **💰 Pricing** | Free (self-hosted) | €9-50/month |
| **🏠 Data Control** | Your servers | Their servers |
| **🤖 AI Features** | OCR, Smart Matching | Limited |
| **📊 Analytics** | Advanced BI Dashboard | Basic reports |
| **🏗️ Architecture** | Modern React 19 | Legacy systems |
| **🇩🇪 ZuGFERD** | Native compliance | Add-on feature |
| **🔧 Customization** | Unlimited | Template limits |

---

## ✨ Key Features

### 📋 **German-Compliant Invoice Management**
- **Complete Invoice Types**: Standard, Abschlag, Schlussrechnung, Storno, Gutschrift
- **ZuGFERD Electronic Invoicing**: Full UN/CEFACT XML compliance
- **Live PDF Preview**: Real-time preview during editing
- **German Tax Compliance**: Built-in 19% VAT calculations
- **Construction Industry**: Retention fee calculations (Einbehalt)

### 🤖 **AI-Powered Automation**
- **OCR Document Processing**: Automatic invoice data extraction
- **Smart Vendor Matching**: ML-powered customer recognition
- **Learning Engine**: Improves accuracy with user feedback
- **Natural Language Processing**: Intelligent data parsing

### 👥 **Customer & Project Management**
- **Comprehensive CRM**: German address formats, tax IDs
- **Project-Based Organization**: Budget tracking, progress monitoring
- **Advanced Analytics**: Revenue metrics, payment behavior
- **Relationship Mapping**: Customer-project-invoice connections

### 💰 **Advanced Payment Processing**
- **Multi-Gateway Support**: Stripe, PayPal, SEPA Direct Debit
- **5-Tier Reminder System**: German-compliant escalation (Mahnung)
- **Payment Links**: Secure, time-limited payment URLs
- **Interest Calculations**: Automatic German base rate + 5%

### 📈 **Business Intelligence Dashboard**
- **Real-Time Analytics**: MRR, YTD, growth rates
- **Cash Flow Analysis**: Monthly trends, forecasting
- **Aging Reports**: 0-30, 31-60, 61-90, 90+ day buckets
- **Tax Reporting**: Quarterly summaries, VAT analysis

### 🏗️ **Enterprise Architecture**
- **React 19 + TypeScript**: Modern, type-safe development
- **6-Store Zustand Architecture**: Optimized state management
- **25+ Custom Hooks**: Domain-specific data operations  
- **TanStack Query**: Advanced caching and synchronization
- **Comprehensive Audit Trail**: Field-level change tracking

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (ES modules support)
- **npm** (latest version)
- Modern browser with ES2020 support

### Installation

```bash
# Clone the repository
git clone https://github.com/bl4ckh4nd/Billux.git
cd Billux

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview

# Run code quality checks
npm run lint
```

### 🌐 Access
- **Development**: http://localhost:5173
- **Production**: Deploy to your preferred hosting platform

---

## 🎨 Screenshots

### Invoice Management with Live Preview
*Real-time PDF generation with German compliance*

### Business Intelligence Dashboard  
*Advanced analytics and cash flow monitoring*

### AI-Powered Document Processing
*OCR invoice scanning with smart data extraction*

---

## 🏗️ Architecture

### **Modern React Stack**
```
Frontend: React 19 + TypeScript 5.8 + Vite 7
Styling: Tailwind CSS 4.1 + Custom Design System
State: Zustand 5.0 (6 specialized stores)
Data: TanStack Query 5.8 + TanStack Table 8.2
Forms: React Hook Form 7.6 + Zod validation
```

### **Domain Architecture**
```
src/
├── components/     # 50+ React components
├── hooks/         # 25+ custom hooks by domain
├── stores/        # 6 Zustand stores with persistence
├── services/      # Business logic + AI services
├── types/         # 8 domain-specific TypeScript definitions
└── locales/       # German/English i18n
```

### **Key Design Patterns**
- **Domain-Driven Design**: Clear business domain separation
- **Custom Hooks Architecture**: Reusable data operations
- **Optimistic Updates**: Immediate UI with rollback capability
- **Multi-Store State**: Specialized stores with persistence
- **Type-Safe Development**: Full TypeScript coverage

---

## 🇩🇪 German Business Compliance

### **ZuGFERD Electronic Invoicing**
- Complete UN/CEFACT CrossIndustryInvoice XML generation
- PDF embedding with pdf-lib integration
- Unit code mapping (Stk, m², kg, etc.)
- Automatic tax structure compliance

### **Legal Compliance Features**
- German address formatting and validation
- VAT ID (USt-IdNr) and Tax ID (Steuer-ID) management
- Proper reminder legal text (Mahnung)
- Interest rate calculations per German law
- Construction industry retention fees

### **Localization**
- Complete German language support
- German date/currency formatting
- Business-specific terminology
- Legal text templates

---

## 🤖 AI & Machine Learning

### **Document Processing**
- **OCR Engine**: Automatic text extraction from invoices
- **Data Validation**: Enhanced error detection and correction
- **Vendor Matching**: K-NN algorithm for customer recognition
- **Learning System**: Naive Bayes classifier improvement

### **Machine Learning Stack**
```typescript
OCR: Mistral AI integration
Classification: ml-naivebayes, ml-knn
NLP: Natural language processing toolkit
Statistics: Advanced statistical analysis
Fuzzy Search: Fuse.js for intelligent matching
```

---

## 📊 Business Features

### **Invoice Types (German Standards)**
- **Standardrechnung**: Regular invoices with VAT
- **Abschlagsrechnung**: Down payment invoices
- **Schlussrechnung**: Final invoices with balance
- **Storno**: Cancellation invoices
- **Gutschrift**: Credit notes

### **Payment Processing**
- **Stripe Integration**: Credit card processing
- **PayPal**: Digital wallet payments  
- **SEPA Direct Debit**: German bank transfers
- **Payment Links**: Secure, expiring URLs
- **Reminder System**: 5-tier German-compliant escalation

### **Analytics & Reporting**
- **Financial KPIs**: MRR, YTD, growth rates
- **Customer Analytics**: Payment behavior, revenue per customer
- **Project Tracking**: Budget vs actual, completion rates
- **Cash Flow**: Monthly analysis with forecasting
- **Tax Reports**: VAT summaries, quarterly reports

---

## 🔧 Configuration

### **Environment Variables**
```env
# AI Services
VITE_MISTRAL_API_KEY=your_mistral_key

# Payment Gateways  
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
VITE_PAYPAL_CLIENT_ID=your_paypal_id

# Email Configuration
VITE_SMTP_HOST=your_smtp_host
VITE_SMTP_PORT=587
```

### **Company Settings**
Configure your business details through the settings interface:
- Company information and branding
- Payment gateway connections
- Email templates and signatures
- Tax rates and accounting preferences
- ZuGFERD compliance settings

---

## 🛠️ Development

### **Technology Stack**
- **Frontend**: React 19.1.0, TypeScript 5.8.3, Vite 7.0.2
- **Styling**: Tailwind CSS 4.1.11, PostCSS, Autoprefixer
- **State Management**: Zustand 5.0.6, TanStack Query 5.81.5
- **Tables**: TanStack Table 8.21.3 with advanced features
- **Forms**: React Hook Form 7.60.0, Zod 3.25.75
- **PDF**: React-PDF 4.3.0, pdf-lib 1.17.1
- **Charts**: Recharts 3.0.2, date-fns 4.1.0
- **AI/ML**: Mistral AI, Natural NLP, ML algorithms
- **i18n**: i18next 25.3.2, react-i18next 15.6.0

### **Development Commands**
```bash
npm run dev        # Start development server (HMR)
npm run build      # Production build with optimization  
npm run lint       # ESLint code quality checks
npm run preview    # Preview production build locally
```

### **Code Quality**
- **ESLint**: Modern flat config with React rules
- **TypeScript**: Strict mode with full type coverage
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance

---

## 🚀 Deployment

### **Self-Hosted Options**
- **Docker**: Containerized deployment
- **Vercel**: Serverless hosting with edge functions
- **Netlify**: JAMstack deployment with forms
- **Traditional**: Apache/Nginx static hosting
- **Cloud**: AWS S3, Google Cloud Storage, Azure

### **Production Checklist**
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Test ZuGFERD compliance
- [ ] Verify payment gateway connections

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes Billux better for everyone.

### **Development Setup**
```bash
# Fork and clone the repository
git clone https://github.com/bl4ckh4nd/Billux.git
cd Billux

# Install dependencies
npm install

# Start development
npm run dev

# Run tests and linting
npm run lint
```

### **Contribution Guidelines**
- Follow the existing code style and TypeScript patterns
- Add tests for new features and bug fixes
- Update documentation for any API changes
- Use conventional commit messages
- Ensure German business compliance for accounting features

---

## 📚 Documentation

### **User Guides**
- [Getting Started](docs/getting-started.md)
- [Invoice Management](docs/invoices.md)
- [Customer & Project Setup](docs/customers-projects.md)
- [Payment Configuration](docs/payments.md)
- [ZuGFERD Compliance](docs/zugferd.md)
- [Analytics & Reporting](docs/analytics.md)

### **Developer Resources**
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Custom Hooks Guide](docs/hooks.md)
- [State Management](docs/state.md)
- [Contributing Guide](CONTRIBUTING.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=bl4ckh4nd/Billux&type=Date)](https://star-history.com/#bl4ckh4nd/Billux&Date)

---

## 💡 Support

### **Community Support**
- [GitHub Issues](https://github.com/bl4ckh4nd/Billux/issues) - Bug reports and feature requests
- [Discussions](https://github.com/bl4ckh4nd/Billux/discussions) - Community help and ideas
- [Wiki](https://github.com/bl4ckh4nd/Billux/wiki) - Comprehensive documentation

### **Professional Support**
For enterprise support, custom development, or commercial licensing, please contact us at [support@billux.com](mailto:support@billux.com).

---

## 🎉 Acknowledgments

- Built with ❤️ for the German business community
- Inspired by the need for transparent, controllable business software
- Thanks to all contributors who make this project possible

---

**Ready to take control of your German invoice management?**

🚀 **[Get Started Now](https://github.com/bl4ckh4nd/Billux)**  
⭐ **[Star us on GitHub](https://github.com/bl4ckh4nd/Billux)**  
🐛 **[Report Issues](https://github.com/bl4ckh4nd/Billux/issues)**

---

*Billux - The future of German invoice management is open source.* 🇩🇪✨
