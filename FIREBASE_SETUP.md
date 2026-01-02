# Firebase Configuration Instructions

To connect ClassTrack to Firebase, create a `.env.local` file in this directory with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Steps to Set Up Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "ClassTrack"
3. Add a web app to your project
4. Copy the configuration values into `.env.local`
5. Enable Authentication:
   - Email/Password provider
   - Google provider
6. Create Firestore Database:
   - Start in production mode
   - Choose a location close to you
7. Set up Firebase Storage:
   - Start in production mode
8. Install Firebase CLI: `npm install -g firebase-tools`
9. Deploy Cloud Functions (when ready): `firebase deploy --only functions`

## Firestore Security Rules

Add these rules in the Firebase Console under Firestore Database > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Teachers can read/write their own data
    match /teachers/{teacherId} {
      allow read, write: if request.auth != null && request.auth.uid == teacherId;
    }
    
    // Teachers can manage their classes
    match /classes/{classId} {
      // Allow read if teacher owns it OR if user is a student in the class
      allow read: if request.auth != null && 
        (resource.data.teacherId == request.auth.uid ||
         request.auth.uid in resource.data.studentIds);
         
      // Allow create if teacherId matches auth uid
      allow create: if request.auth != null && request.resource.data.teacherId == request.auth.uid;
      
      // Allow update/delete if teacher owns the existing doc
      allow update, delete: if request.auth != null && resource.data.teacherId == request.auth.uid;
    }
    
    // Teachers can manage students in their classes
    match /students/{studentId} {
      allow read, write: if request.auth != null;
    }
    
    // Teachers can manage behaviors
    match /behaviors/{behaviorId} {
      allow read, write: if request.auth != null;
    }
    
    // Teachers can log incidents
    match /incidents/{incidentId} {
      allow read, write: if request.auth != null;
    }
    
    // Teachers can manage focus lists
    match /focusLists/{focusListId} {
      allow read, write: if request.auth != null;
    }
    
    // Teachers can manage documents
    match /documents/{documentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Security Rules

Add these rules in the Firebase Console under Storage > Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /students/{studentId}/documents/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```
