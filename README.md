# 🏥 Smart Health Companion

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)

**A modern, AI-powered healthcare management platform connecting patients with doctors seamlessly.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🤖 AI Health Assistant

- **Intelligent Symptom Analysis** - Describe your symptoms and get instant guidance
- **Specialist Recommendations** - AI suggests the right type of doctor for your condition
- **Empathetic Responses** - Natural conversation with helpful health advice
- **Emergency Detection** - Identifies urgent symptoms requiring immediate care

### 👨‍⚕️ Doctor Portal

- **Appointment Management** - View, confirm, complete, or cancel appointments
- **Patient Records** - Access comprehensive patient medical histories
- **Prescription Writing** - Create and manage digital prescriptions
- **Schedule Management** - Interactive calendar with time slot management
- **Dashboard Analytics** - Track daily appointments, patients, and more

### 👤 Patient Portal

- **Doctor Discovery** - Browse doctors by specialty with ratings and fees
- **Easy Booking** - Book appointments with preferred doctors in 3 simple steps
- **Medical Records** - Upload and manage personal health records
- **Prescription History** - View all prescriptions from your doctors
- **AI Chat Support** - 24/7 health guidance from our AI assistant

### 🔐 Security & Auth

- **Secure Authentication** - NextAuth.js with credential-based login
- **Password Recovery** - Email-based forgot password flow
- **Role-Based Access** - Separate doctor and patient experiences
- **Protected Routes** - Middleware-secured API and pages

---

## 🛠 Tech Stack

| Category     | Technologies                                   |
| ------------ | ---------------------------------------------- |
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS |
| **Backend**  | Next.js API Routes, NextAuth.js                |
| **Database** | PostgreSQL with Prisma ORM                     |
| **AI**       | Google Gemini API                              |
| **Styling**  | Tailwind CSS, Radix UI Components              |
| **Email**    | Nodemailer                                     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/shellyjain0712/HealthAssist.git
   cd HealthAssist
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/healthassist"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Google Gemini AI
   GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

   # Email (Optional)
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@healthassist.com"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

---

## 📸 Screenshots

<div align="center">

### 🔐 Sign In Page
*Modern, secure authentication with Google OAuth and email sign-in*

![Sign In](screenshots/signin.png)

---

### 🤖 AI Health Assistant
*Intelligent symptom analysis with chat history and quick-start prompts*

![AI Chat](screenshots/ai-chat.png)

---

### 📅 Book Appointment
*Easy specialty selection with available doctors count*

![Book Appointment](screenshots/book-appointment.png)

---

### 👨‍⚕️ Doctor Dashboard
*Complete overview with stats, quick actions, and patient management*

![Doctor Dashboard](screenshots/doctor-dashboard.png)

</div>

---

## 📁 Project Structure

```
smart-health-companion/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── appointments/  # Appointment CRUD
│   │   │   ├── auth/          # Authentication
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   ├── doctors/       # Doctor listings
│   │   │   └── ...
│   │   ├── appointments/      # Booking pages
│   │   ├── auth/              # Auth pages
│   │   ├── chat/              # AI chat page
│   │   ├── dashboard/         # Main dashboard
│   │   ├── doctors/           # Doctor browsing
│   │   ├── schedule/          # Doctor schedule
│   │   └── ...
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── auth.ts            # Auth configuration
│       ├── prisma.ts          # Database client
│       └── utils.ts           # Utility functions
└── ...
```

---

## 🎯 Key Functionalities

### For Patients

- 💬 Chat with AI for health guidance
- 🔍 Find doctors by specialty
- 📅 Book appointments online
- 📋 View prescriptions and records
- ⭐ Rate and review doctors

### For Doctors

- 📊 Dashboard with daily overview
- 📅 Manage appointment schedule
- 💊 Write digital prescriptions
- 👥 Access patient records
- ✅ Confirm/Cancel appointments

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for better healthcare**

⭐ Star this repo if you find it helpful!

</div>
