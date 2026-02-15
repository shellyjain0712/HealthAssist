# Quick Start Guide - User Authentication Module

## 🚀 Quick Setup (5 minutes)

### Step 1: Database Setup
You have the database already configured with Prisma local PostgreSQL. Run:
```bash
cd smart-health-companion
npx prisma migrate dev --name init
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test the Application
Open browser: `http://localhost:3000`

---

## 📋 Testing Checklist

### ✅ Test Patient Registration
1. Go to `http://localhost:3000/auth/signup`
2. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `patient@test.com`
   - Phone: `+1234567890`
   - Role: **Patient**
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"
4. Should redirect to sign-in page

### ✅ Test Patient Login
1. Go to `http://localhost:3000/auth/signin`
2. Login with:
   - Email: `patient@test.com`
   - Password: `password123`
3. Should redirect to dashboard
4. Verify patient information displays

### ✅ Test Patient Profile Update
1. Click "Edit Profile" button
2. Fill in medical information:
   - Date of Birth: Select a date
   - Gender: `Male`
   - Address: `123 Main St`
   - Blood Group: `O+`
   - Allergies: `Peanuts, Penicillin`
   - Emergency Contact: `+0987654321`
3. Click "Save Changes"
4. Verify success message appears

### ✅ Test Doctor Registration
1. Sign out (if logged in)
2. Go to `http://localhost:3000/auth/signup`
3. Fill in the form:
   - First Name: `Dr. Sarah`
   - Last Name: `Smith`
   - Email: `doctor@test.com`
   - Phone: `+1234567891`
   - Role: **Doctor**
   - Specialization: `Cardiologist`
   - License Number: `MED123456`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Create Account"
5. Login with doctor credentials

### ✅ Test Doctor Profile Update
1. Login as doctor
2. Click "Edit Profile"
3. Update professional information:
   - Years of Experience: `10`
   - Consultation Fee: `150`
   - Education: `MD from Harvard Medical School`
   - Bio: `Experienced cardiologist specializing in heart disease`
4. Click "Save Changes"
5. Return to dashboard and verify doctor information

### ✅ Test Admin Registration
1. Sign out
2. Register with role: **Admin**
3. Login and verify admin dashboard access

---

## 🔍 Key Features to Demonstrate

### 1. Role-Based Access Control
- Different users see different profile fields
- Patients see medical fields (blood group, allergies)
- Doctors see professional fields (license, specialization)

### 2. Session Management
- Login persists across page refreshes
- Dashboard requires authentication
- Sign out clears session

### 3. Form Validation
- Email format validation
- Password minimum 8 characters
- Required fields enforcement
- Password confirmation matching

### 4. Security Features
- Passwords are hashed (not stored in plain text)
- Protected routes redirect to signin
- JWT-based authentication

---

## 📊 Database Inspection

### Open Prisma Studio
```bash
npx prisma studio
```
This opens a GUI at `http://localhost:5555` to view/edit database records.

### View Tables
- **User** table: Email, role, password (hashed), verification status
- **Profile** table: All user profile information

---

## 🎯 Demo Flow for Presentation

1. **Show Registration** (2 min)
   - Navigate to signup page
   - Show role selection
   - Register a patient account
   - Show doctor-specific fields when selecting doctor role

2. **Show Login** (1 min)
   - Login with created account
   - Show automatic redirect to dashboard

3. **Show Dashboard** (2 min)
   - Display user information
   - Show role-specific data
   - Demonstrate navigation

4. **Show Profile Management** (3 min)
   - Navigate to profile edit page
   - Update information for patient
   - Update information for doctor
   - Show different fields for different roles

5. **Show Security** (2 min)
   - Try accessing `/dashboard` without login
   - Show redirect to signin
   - Show hashed password in database (Prisma Studio)

---

## 🛠️ Common Commands

```bash
# Start dev server
npm run dev

# Database commands
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create migration
npx prisma generate        # Generate Prisma Client
npx prisma migrate reset   # Reset database

# Build for production
npm run build
npm start
```

---

## 📝 Test Accounts Reference

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@test.com | password123 |
| Doctor | doctor@test.com | password123 |
| Admin | admin@test.com | password123 |

---

## 🐛 Troubleshooting

### "Database connection error"
```bash
# Check if Prisma local DB is running
# The DATABASE_URL should work automatically with Prisma local setup
npx prisma migrate dev
```

### "Module not found" errors
```bash
npm install
```

### "Invalid credentials" on login
- Ensure you registered the account first
- Check email/password are correct
- Database might be empty - create new account

### Page not loading
- Ensure dev server is running (`npm run dev`)
- Check console for errors
- Clear browser cache

---

## 🎓 Learning Points

This module demonstrates:
1. **Full-stack authentication** with Next.js App Router
2. **Database modeling** with Prisma ORM
3. **Role-based access control** implementation
4. **Form handling** and validation in React
5. **API route creation** in Next.js
6. **Session management** with NextAuth.js
7. **TypeScript** for type safety
8. **Modern UI** with Tailwind CSS and Shadcn/UI

---

## ✨ Ready for Integration

This authentication module is now ready to be integrated with:
- Health Record Management (users can store medical records)
- Appointment Booking (patients book with doctors)
- AI Chatbot (personalized health guidance)
- Doctor Dashboard (view patients and appointments)
- Analytics & Reports (user-specific health insights)
