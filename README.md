# Prospero - Teacher Behavior & Context Monitor

A comprehensive classroom management tool that empowers teachers to monitor student behaviors, track progress over time, and communicate data-driven insights to parents.

## Features

✅ **Secure Authentication**
- Email/password and Google OAuth login
- Teacher-specific accounts with profile management

✅ **Class & Student Management**
- Create and manage multiple classes
- Add students with parent contact information  
- Upload and store IEP/504 documents (Firebase Storage)

✅ **Focus Zone Interface**
- Split-screen layout: Master Roster (left) + Focus Zone (right)
- Click students to add them to your Focus Zone
- Persistent focus list - your selections are saved across sessions

✅ **Behavior Tracking**
- Define custom positive and negative behaviors
- Quick-log behaviors with timestamps
- Optional notes for each incident

✅ **Data Persistence**
- All data stored securely in Firebase Firestore
- Real-time synchronization
- Automatic backups

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: React Hooks & Context

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account
- Firebase project created

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd classtrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   
   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project (or use existing)
   
   c. Enable Authentication:
      - Email/Password provider
      - Google provider
   
   d. Create Firestore Database (start in production mode)
   
   e. Create Storage bucket (start in production mode)
   
   f. Copy your Firebase config

4. **Configure environment variables**
   
   Create `.env.local` file in the `classtrack` directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore Security Rules**
   
   See `FIREBASE_SETUP.md` for detailed security rules

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### First Time Setup

1. **Create Account**: Sign up with email/password or Google
2. **Create a Class**: Click "Create New Class" on the dashboard
3. **Add Students**: Use "Add Student" button to populate your roster
4. **Configure Behaviors**: Define the behaviors you want to track

### Daily Workflow

1. **Open Your Class**: Click on a class from your dashboard
2. **Build Your Focus Zone**: Click students from the Master Roster to add them to the Focus Zone
3. **Log Behaviors**: Click a student card in the Focus Zone to quickly log behaviors
4. **Monitor Progress**: Focus Zone persists across sessions - same students appear next time

### Managing Students

- **Add Parent Contacts**: Include email addresses for future reporting features
- **Upload Documents**: Attach IEP/504 documents to student profiles
- **Edit/Delete**: Manage student information as needed

### Behavior Management

- **Positive Behaviors**: Encouraged actions (e.g., "Active Listening", "Helping Others")
- **Negative Behaviors**: Actions needing correction (e.g., "Disruption", "Off-Task")
- **Quick Logging**: One-click logging with optional notes

## Project Structure

```
classtrack/
├── app/
│   ├── classes/[classId]/     # Class detail pages
│   │   ├── behaviors/         # Behavior configuration
│   │   └── page.tsx          # Focus Zone interface
│   ├── dashboard/            # Teacher dashboard
│   ├── signup/               # Registration page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Login page
├── components/
│   ├── AuthProvider.tsx      # Authentication context
│   ├── BehaviorForm.tsx      # Behavior creation form
│   ├── BehaviorLogModal.tsx  # Quick behavior logging
│   ├── ClassForm.tsx         # Class creation form
│   ├── FocusZone.tsx         # Focus zone panel
│   ├── MasterRoster.tsx      # Student roster sidebar
│   ├── Navbar.tsx            # Navigation bar
│   ├── StudentCard.tsx       # Student card component
│   └── StudentForm.tsx       # Student creation form
├── hooks/
│   └── useFocusList.ts       # Focus list state management
├── lib/
│   ├── firebase.ts           # Firebase configuration
│   ├── firestore.ts          # Firestore operations
│   └── storage.ts            # Firebase Storage operations
├── types/
│   └── index.ts              # TypeScript type definitions
└── FIREBASE_SETUP.md         # Firebase configuration guide
```

## Firestore Collections

```
/teachers/{teacherId}         # Teacher profiles
/classes/{classId}            # Class information
/students/{studentId}         # Student data & parent contacts
/behaviors/{behaviorId}       # Custom behavior definitions
/incidents/{incidentId}       # Logged behavior incidents
/focusLists/{focusListId}     # Persistent focus zone state
/documents/{documentId}       # Document metadata (files in Storage)
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy --only hosting`

## Roadmap

Future features planned:
- 📊 Analytics dashboard with behavior trend graphs
- 📧 Parent reporting via email
- 📱 Mobile-responsive drag-and-drop
- 👥 Parent portal (read-only access)
- 🔔 SMS notifications for urgent alerts
- 📁 Document viewer (PDF preview)
- 📈 Class-wide behavior analytics

## Contributing

This is a personal project for classroom management. Feel free to fork and adapt for your needs!

## License

MIT

## Support

For issues or questions, please refer to the `FIREBASE_SETUP.md` file for Firebase configuration help.

---

**Built with ❤️ for teachers who care about their students**
