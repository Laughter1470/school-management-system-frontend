School Management System
A real-time student dashboard for managing student records with secure authentication.
Live Demo
https://school-management-system-frontend-tau.vercel.app
Features

CRUD Operations: Add, edit, delete students with Supabase backend.
Real-Time Updates: Instant data sync across sessions.
Search & Sort: Filter students by name/email, sort by name/email.
Pagination: Responsive pagination with ellipsis.
Form Validation: Real-time name and email validation with uniqueness check.
Animations: Fade-in/out for messages, shake for errors.
Dark/Light Mode: Theme toggle with localStorage persistence.
Mobile Responsive: Optimized for phones and tablets.
User Authentication: Secure login/signup with Supabase Auth.
Sticky Header: Fixed navigation for better UX.

Tech Stack

Frontend: React + Vite + TypeScript
Styling: Tailwind CSS
Backend: Supabase (Database, Auth, Realtime)
Routing: React Router
Deployment: Vercel

Setup

Clone the repo:git clone https://github.com/Laughter1470/school-management-system-frontend.git
cd school-management-system-frontend


Install dependencies:npm install


Set up environment variables in .env:VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key


Run locally:npm run dev



Deployment
Deployed on Vercel. Update environment variables in Vercel dashboard and push to GitHub for auto-deployment.
Future Enhancements

Password strength validation
Admin roles for restricted access
Student profile details (photo, grades)
CSV export for student list
