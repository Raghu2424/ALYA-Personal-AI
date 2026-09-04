# ALYA — Personal AI Companion & Second Brain

> **"Remember what matters. Reach your goals. Get personalized help every day."**

[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Gemini API](https://img.shields.io/badge/Gemini%20AI-2.5%20%26%203.8%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Title

**ALYA** (Adaptive Lifelong Yield Assistant) — Your Context-Aware Personal AI Companion and Second Brain.

---

## 2. Tagline

> *Your AI that actually knows you. A private, intelligent second brain that remembers your life context, deconstructs your ambitions, and guides your daily execution.*

---

## 3. Project Overview

ALYA is an AI companion and second-brain platform built on top of **Google Gemini**, **Cloud Firestore**, and **Google Firebase Authentication**, running on **Google Cloud Run**.

Unlike generic chatbot interfaces that reset to a blank slate with every conversation, ALYA acts as a continuous, private cognitive partner:
- **Persistent Personal Memory Vault**: Stores essential facts, values, preferences, health notes, and career details.
- **Goal Decomposition & Planning Engine**: Breaks high-level life and career objectives into actionable subtasks with time estimates and priority ratings.
- **Action-Oriented Task Board**: Focuses on immediate execution with AI smart recommendations based on deadline velocity and personal goals.
- **Mindful Introspective Journal**: Provides psychological and productivity analysis of daily reflections (identifying achievements, core challenges, and constructive next steps).
- **Strategic AI Insights**: Periodically analyzes longitudinal progress across tasks, goals, and reflections to deliver personalized executive coaching.

Every interaction is private, isolated by authenticated Firebase UID, and secured through server-side API proxies with an automated multi-tier Gemini model fallback ladder.

---

## 4. Problem Statement

Modern knowledge workers and students face severe cognitive fragmentation:
1. **Tool Sprawl**: Daily life is scattered across notes apps, todo managers, spreadsheets, and calendar reminders.
2. **Context-Blind AI**: Mainstream AI chatbots have zero persistent awareness of who the user is. Every interaction requires the user to restate their goals, preferences, constraints, and background.
3. **The Intention-to-Action Gap**: Users set ambitious annual or quarterly goals, but fail to convert them into concrete, low-friction daily habits and micro-tasks.
4. **Privacy & Data Vulnerability**: Storing sensitive personal journals, health data, and career goals in generic cloud notes risks data leakage, unsegmented storage, and unauthorized indexing.

---

## 5. Solution

ALYA bridges the gap between passive memory storage and active execution:
- **Unified Second Brain Ecosystem**: Seamlessly integrates memories, ambitions, tasks, reflections, and conversational AI into a unified, responsive single-page application.
- **Dynamic Context Injection**: Every chat prompt and planning request dynamically fetches the user's active memories, in-progress goals, and outstanding tasks, feeding structured context directly into the Gemini prompt pipeline.
- **Zero-Trust Security & Data Isolation**: All documents in Cloud Firestore are strictly partitioned by authenticated Google Firebase UID (`/users/{userId}/*`). Path-level security rules prevent any cross-user leakage.
- **Resilient Server-Side Intelligence**: Secrets are isolated in Google Cloud Secret Manager. The backend proxy utilizes an automated fallback ladder (`gemini-2.5-flash` → `gemini-flash-latest` → `gemini-3.1-flash-lite` → `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.7-flash`) to guarantee 99.9% availability during traffic spikes.

---

## 6. Key Features

| Feature | Description |
| :--- | :--- |
| 🧠 **Personal Memory Vault** | Categorized knowledge repository (Work, Health, Learning, Values, Preferences, Projects, General) with fast search and instant editing. |
| 💬 **Context-Infused AI Chat** | Conversational companion that automatically cites your saved memories, active goals, and pending tasks when giving advice. |
| 🎯 **Goal Decomposition** | One-click AI milestone breakdown that generates 3–6 actionable tasks with time estimates and priority levels. |
| ✅ **Adaptive Task Manager** | Filter by Today, Upcoming, and Completed with status toggles, priority flags, and smart focus recommendations. |
| 📔 **Mindful Journal & AI Analysis** | Emotional reflection logging with mood indicators (`Great`, `Good`, `Neutral`, `Difficult`, `Stressed`) and structured AI introspective analysis. |
| 📊 **Strategic AI Insights** | Trajectory synthesis analyzing task completion velocity, goal momentum, and journaling themes with strategic recommendations. |
| ⚙️ **Privacy & Persona Customization** | Configurable AI tone (`friendly`, `concise`, `thoughtful`, `practical`), profile bio sync, and one-click total personal data erasure. |

---

## 7. How ALYA Works

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (React 19)                       │
│  Landing Page ── Google Sign-In ── Dashboard ── Chat ── Vault ── Goals │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ 1. Firebase Auth                │ 2. Real-time Sync
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Firebase Authentication        │  │       Cloud Firestore        │
│  - Google Identity Provider          │  │  - Path: /users/{uid}/*      │
│  - Secure JWT Session Token          │  │  - Rules: request.auth == uid│
└──────────────────────────────────────┘  └──────────────┬───────────────┘
                                                         │
                   ┌─────────────────────────────────────┘
                   │ 3. Fetch Context (Memories, Goals, Tasks)
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS BACKEND PROXY                           │
│  /api/chat  •  /api/goals/decompose  •  /api/journal/analyze  •  /api/insights
│                                                                        │
│  - Defensive Payload Ingestion & Validation                            │
│  - Context Window Construction & System Persona Injection              │
│  - Resilient Model Fallback Ladder (`generateContentWithFallback`)     │
└──────────────────┬─────────────────────────────────────────────────────┘
                   │ 4. Prompt with Dynamic Context
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     GOOGLE GEMINI AI ENGINE                            │
│  Primary: gemini-2.5-flash / gemini-flash-latest                       │
│  Fallback: gemini-3.1-flash-lite / gemini-3.8-flash / gemini-3.7-flash │
└──────────────────┬─────────────────────────────────────────────────────┘
                   │ 5. Structured JSON / Streamed Output
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               CLIENT APPLICATION & PERSISTENCE ENGINE                  │
│  - cleanPayload() strips undefined values before Firestore mutations   │
│  - UI updates optimistically with immediate visual state feedback       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Authentication**: The user logs in securely using Google Sign-In via Firebase Authentication.
2. **Context Aggregation**: When the user requests a chat turn, goal breakdown, or daily plan, the client or server collects active memories, incomplete tasks, and in-progress goals.
3. **System Prompt Formulation**: ALYA constructs a strict system prompt wrapping user context with protective delimiters, preventing prompt injection and enforcing persona rules.
4. **Resilient AI Execution**: The Express server routes the request through `@google/genai` using `generateContentWithFallback()`, ensuring automatic retry across multiple models if rate limits or transient errors occur.
5. **Atomic Cloud Persistence**: Output is returned to the client and saved to Cloud Firestore under the user's isolated subcollection (`/users/{uid}/*`).

---

## 8. Technology Stack

### Frontend
- **Framework**: React 19 (Functional components, custom hooks, context providers)
- **Language**: TypeScript 5.8 (Strict type safety, explicit interfaces)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom dark luxury neutral palette
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Motion (`motion/react`)

### Backend
- **Runtime**: Node.js 22 LTS
- **Server Framework**: Express 4.21 with native JSON body parser
- **Development & Bundling**: `tsx` (hot dev execution), `esbuild` (standalone production CommonJS bundle)
- **Environment Management**: `dotenv` with Google Cloud Secret Manager integration

### AI & Cloud Services
- **AI SDK**: `@google/genai` (v2.4.0)
- **Foundation Models**: Google Gemini 2.5 Flash, Gemini Flash Latest, Gemini 3.1 Flash Lite, Gemini 3.8 Flash, Gemini 3.7 Flash
- **Database**: Google Cloud Firestore (Enterprise Edition)
- **Authentication**: Firebase Authentication (Google Identity Provider)
- **Hosting & Compute**: Google Cloud Run (Containerized serverless compute)

---

## 9. Architecture Overview

ALYA follows a **Full-Stack Server + Client Architecture**:
- **Single Port Delivery**: The dev and production servers both bind to port `3000` on host `0.0.0.0`. In development, Vite runs as an integrated Express middleware; in production, Express serves pre-compiled static assets from `dist/` while exposing `/api/*` endpoints.
- **Client-Side Firebase SDK**: Authenticated users interact directly with Firestore using the official Firebase Web SDK, taking advantage of real-time `onSnapshot` listeners and optimistic local caching.
- **Server-Side AI Proxy**: The `GEMINI_API_KEY` is strictly confined to `server.ts`. Frontend components never have access to raw Gemini API keys, shielding credentials from browser DevTools.

---

## 10. Gemini AI Integration

### Server-Side Resilient Fallback Ladder
To eliminate single points of failure and gracefully handle API quota limits (`429 RESOURCE_EXHAUSTED`, `503 UNAVAILABLE`, or transient timeouts), ALYA implements a resilient fallback ladder in `server.ts`:

```typescript
const MODEL_FALLBACK_LADDER = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview'
];

async function generateContentWithFallback(options: GenerateOptions): Promise<string> {
  const ai = getGenAI();
  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({ model, contents: options.contents, config: options.config }),
        timeoutPromise(8000)
      ]);
      if (response?.text) return response.text;
    } catch (err) {
      // Automatically attempts the next model in the ladder upon error
    }
  }
  throw new Error('All fallback models exhausted');
}
```

### Dedicated AI Endpoints
1. `POST /api/chat`: Generates context-aware conversational replies conditioned on the user's memories, goals, tasks, and preferred companion tone.
2. `POST /api/goals/decompose`: Deconstructs ambitious objectives into 3–6 actionable tasks formatted as structured JSON.
3. `POST /api/tasks/recommend`: Evaluates task priorities, deadlines, and active goals to suggest the single highest-impact task for the user's immediate attention.
4. `POST /api/journal/analyze`: Delivers constructive, introspective psychological analysis of personal reflections (Achievements, Core Challenges, Suggested Next Steps).
5. `POST /api/insights`: Synthesizes holistic weekly second-brain trajectory reports.

---

## 11. Firebase Authentication

ALYA uses Google Sign-In via Firebase Authentication:
- **Zero Password Storage**: Eliminates credential theft risks by delegating identity verification entirely to Google's secure OAuth 2.0 infrastructure.
- **Session Continuity**: Authentication state is observed via `onAuthStateChanged` in `AuthContext.tsx`. Sessions persist across page refreshes and browser re-opens.
- **Automatic User Provisioning**: Upon first login, an initial profile document is synced to `/users/{uid}` with fields for display name, email, profile photo, and default companion tone.
- **Iframe & Tab Compatibility**: Supports `signInWithPopup` with fallback instructions for sandbox iframe restrictions in hosted preview environments.

---

## 12. Firestore Data Model

All user entities are scoped under the primary collection `/users/{userId}`:

```
databases/(default)/documents/
└── users/{userId}
    ├── memories/{memoryId}
    ├── goals/{goalId}
    ├── tasks/{taskId}
    ├── journal/{entryId}
    ├── conversations/{conversationId}
    └── interactions/{interactionId}
```

### Entity Schemas

| Collection / Path | Entity | Key Fields | Purpose |
| :--- | :--- | :--- | :--- |
| `/users/{userId}` | `UserProfile` | `uid`, `email`, `displayName`, `photoURL`, `aiTone`, `createdAt` | Root user record and companion preferences |
| `/users/{userId}/memories/{id}` | `MemoryItem` | `ownerUid`, `content`, `category`, `createdAt`, `updatedAt` | Facts, skills, values, and preferences |
| `/users/{userId}/goals/{id}` | `GoalItem` | `ownerUid`, `title`, `description`, `progress`, `deadline`, `status` | High-level milestones and progress tracking |
| `/users/{userId}/tasks/{id}` | `TaskItem` | `ownerUid`, `title`, `priority`, `completed`, `dueDate`, `relatedGoalId` | Actionable checklist items with goal links |
| `/users/{userId}/journal/{id}` | `JournalEntry` | `ownerUid`, `title`, `content`, `mood`, `tags`, `analysis` | Private thoughts, reflections, and AI analyses |
| `/users/{userId}/conversations/{id}` | `ChatMessage` | `role`, `text`, `timestamp` | Conversational turn history with ALYA |
| `/users/{userId}/interactions/{id}` | `InteractionLog` | `type`, `description`, `timestamp` | Security audit trail and activity telemetry |

---

## 13. Security Approach

ALYA enforces security across all 5 Agentic Threat Zones:

### 1. The 5 Threat Zones Defense Matrix

| Threat Zone | Threat Vector | Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection through journal text, goal descriptions, or custom prompts. | Defensive payload sanitization, type guarding, and strict input truncation before DB writes or AI calls. |
| **Planning & Reasoning** | Prompt injection attempting to hijack ALYA's companion persona or extract other users' data. | Encapsulated system instructions with bounded context delimiters; user memories and entries are treated strictly as data payloads, never as executable meta-instructions. |
| **Tool Execution** | Transient Gemini API exhaustion (429, 503) or silent failures during task planning/insights. | Resilient model fallback ladder (`gemini-2.5-flash` with graceful deterministic degradation), non-blocking error handling, and persistent local state buffers. |
| **Memory & State** | Cross-user data contamination, unauthorized reads/writes, or state leakage across browser sessions. | Client and database layer enforcement: all queries filter strictly by `where('ownerUid', '==', user.uid)`; rules enforce owner-bound authorization (`request.auth.uid == userId`). |
| **Inter-System Communication** | Leakage of API credentials or unauthorized client-side administrative token exposure. | Zero hardcoded API keys; OAuth tokens and Firebase authentication credentials are managed client-side via Google Identity Services and Firebase Auth with strict referrer policies (`no-referrer`). |

### 2. Firestore Security Rules
The production `firestore.rules` enforces owner-bound path isolation across all collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated User Partition
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null && request.auth.uid == userId
        && (!('uid' in request.resource.data) || request.resource.data.uid == userId);
      allow delete: if request.auth != null && request.auth.uid == userId;

      match /memories/{memoryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /journal/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default Deny Catch-All
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Zero-Crash Payload Hygiene (`cleanPayload`)
Firestore SDK calls crash if passed objects with `undefined` values. ALYA runs every outgoing payload through a recursive sanitization utility before calling `setDoc` or `updateDoc`, ensuring crash-free database writes.

---

## 14. AI Memory System

The Memory Vault acts as ALYA's long-term cognitive foundation:
- **Categorization**: Entries are tagged into 8 distinct life domains: `Work`, `Personal`, `Health`, `Learning`, `Values`, `Preferences`, `Projects`, and `General`.
- **Dynamic Context Injection**: When generating responses, ALYA retrieves the user's top memories and injects them into the prompt under a `<user_memories>` boundary.
- **Full User Control**: Users can review, search, edit, or delete any memory fact at any time. ALYA never invents memories that the user did not authorize or save.

---

## 15. Goals and Tasks

ALYA bridges the gap between high-level ambition and daily execution:
- **Milestone Tracking**: Goals include numeric progress bars (0–100%), target deadlines, status badges (`In Progress`, `Completed`, `Paused`, `Not Started`), and qualitative descriptions.
- **AI Task Decomposition**: Clicking **"✨ Break this goal into tasks"** invokes the Gemini model to parse the goal title and description, returning 3–6 concrete subtasks with priority ratings and estimated completion times.
- **One-Click Queue Insertion**: Users can check or uncheck suggested tasks and add them directly to their daily task list, maintaining bidirectional linkage to the parent goal.
- **AI Focus Recommendations**: The task manager includes a **Recommend Focus** action that analyzes deadlines, priority levels, and goal velocity to highlight the single most impactful task for immediate completion.

---

## 16. Journal and AI Insights

- **Mindful Journaling**: Users record daily thoughts, tag entries, and choose their current emotional state (`Great`, `Good`, `Neutral`, `Difficult`, `Stressed`).
- **Psychological & Productivity Reflection**: Clicking **"✨ Analyze Reflection"** triggers a structured Gemini evaluation that generates:
  - 🌟 **Key Achievement**: Acknowledges what went well and validates positive effort.
  - 💡 **Core Challenge**: Identifies subtle bottlenecks, stressors, or self-limiting thoughts.
  - 🚀 **Suggested Next Step**: Offers a gentle, constructive action for the following day.
- **Strategic Second Brain Insights**: The Insights dashboard synthesizes overall momentum across completed tasks, active goals, and journal trends to deliver actionable weekly advice.

---

## 17. Local Development Setup

### Prerequisites
- **Node.js**: Version 20 LTS or 22 LTS
- **Package Manager**: `npm` (bundled with Node.js) or `bun`
- **Google Cloud SDK (`gcloud`)**: Optional, for Cloud Run deployment

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/alya.git
   cd alya
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and configure your API keys:
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   ```
   This generates static client assets in `dist/` and compiles `server.ts` into a self-contained bundle at `dist/server.cjs`.

6. **Run Production Server Locally**:
   ```bash
   npm start
   ```

---

## 18. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# =====================================================================
# ALYA Environment Configuration
# NEVER commit real credentials, tokens, or secrets to version control.
# =====================================================================

# Required: Google Gemini API Key for server-side AI generation
GEMINI_API_KEY=your_api_key_here

# Optional: Fully qualified application URL
APP_URL=http://localhost:3000

# Node Environment ('development' or 'production')
NODE_ENV=development
```

> **Security Notice**: In production environments (such as Google Cloud Run), secrets should be provided via **Google Cloud Secret Manager** rather than committed `.env` files.

---

## 19. Google Cloud Run Deployment Instructions

Follow these step-by-step instructions to deploy ALYA to **Google Cloud Run**:

### 1. Prerequisites & CLI Authentication
```bash
# Log in to Google Cloud
gcloud auth login

# Set your active Google Cloud project ID
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Secret Management Setup
Store your Gemini API key securely in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "your_api_key_here" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Deploy to Cloud Run
Deploy the application using the native source-to-container build pipeline:

```bash
gcloud run deploy alya \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### 5. Mandatory Campaign Labeling
Apply the required challenge verification label to register the service for challenge scoring:

```bash
gcloud run services update alya \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

### 6. Authorize Deployment Domain in Firebase
1. Open the [Firebase Console](https://console.firebase.google.com/) and navigate to your project.
2. Go to **Authentication** → **Settings** → **Authorized domains**.
3. Add your deployed Cloud Run URL (e.g. `alya-xxxxxx-as.a.run.app`).

---

## 20. Testing Instructions

Every user flow in ALYA can be validated through the following end-to-end walkthrough test cases:

### Test Case 1: Landing Page & Auth Initialization
1. Navigate to `http://localhost:3000` (or your deployed Cloud Run URL) in an incognito window.
2. Verify brand title **ALYA**, headline, and the 3 feature cards (Personal Memory, Goals & Tasks, Contextual AI).
3. Click **"Continue with Google"**; verify the Google Identity authentication popup opens.

### Test Case 2: Session Setup & Profile Sync
1. Complete sign-in with your Google account.
2. Verify redirect to the authenticated dashboard.
3. Confirm dynamic greeting: *"Good morning/afternoon/evening, [Name] 👋"*.
4. Verify initial metrics display (Active Goals, Completed Tasks, Memories, Activity Streak).

### Test Case 3: Personal Memory Vault (CRUD)
1. Navigate to **🧠 Memory**.
2. Click **"Add Memory"**. Select category `Learning`, enter *"Preparing for Google Cloud Run AI certification"*, and click **Save Memory**.
3. Verify the memory appears immediately in the grid with category badge.
4. Click the search bar and filter by keyword; verify instant filtering.
5. Click the trash icon to test deletion; confirm the modal removes the item.

### Test Case 4: Goal Management & AI Task Decomposition
1. Navigate to **🎯 Goals**.
2. Click **"New Goal"**. Title: *"Launch SaaS Product on Cloud Run"*, target date: 30 days out. Save.
3. On the new goal card, click **"✨ AI Task Planner"**.
4. Verify ALYA returns 3–5 actionable subtasks with estimated completion times.
5. Select the tasks and click **"Add Selected Tasks to My Queue"**.
6. Switch to the **✅ Tasks** tab; verify the new tasks are present and tagged with the parent goal.

### Test Case 5: Task Management & Focus Recommendation
1. In the Tasks view, click the status circle of a task; verify it marks complete and updates the dashboard completion rate.
2. Click **"Recommend Focus"**; verify ALYA analyzes your pending tasks and highlights the highest-priority action.

### Test Case 6: Context-Aware AI Chat
1. Navigate to **💬 AI Chat**.
2. Send the message: *"What goals am I currently working on?"*.
3. Verify ALYA answers accurately, referencing your actual active goals stored in Firestore.
4. Click **"Clear History"**; verify conversation messages are cleared from Firestore.

### Test Case 7: Journal Reflection & Introspective Analysis
1. Navigate to **📔 Journal**.
2. Click **"New Entry"**. Select mood `Energized`, enter thoughts on today's development milestones, and click **Save Entry**.
3. On the saved entry, click **"✨ Analyze Reflection"**.
4. Confirm ALYA returns structured insights:
   - 🌟 **Key Achievement**
   - 💡 **Growth Challenge**
   - 🚀 **Suggested Next Step**
5. Refresh the browser; confirm the analysis remains persisted with the entry.

### Test Case 8: Data Privacy & Total Deletion (Danger Zone)
1. Navigate to **⚙️ Settings**.
2. Under Danger Zone, click **"Delete Personal Data"**.
3. Type `DELETE` into the confirmation field and click **"Confirm Erase"**.
4. Verify all memories, goals, tasks, journal entries, and chat logs are deleted from Firestore.
5. Click **"Log Out"**; verify return to the unauthenticated Landing Page.

---

## 21. Project Structure

```
.
├── .env.example                    # Sample environment variables file
├── .gitignore                      # Git ignore rules
├── README.md                       # Comprehensive documentation & deployment guide
├── firebase-applet-config.json     # Firebase project client credentials
├── firebase-blueprint.json         # Intermediate schema representation (IR)
├── firestore.rules                 # Hardened, owner-bound Firestore security rules
├── index.html                      # HTML entry point with metadata sync
├── metadata.json                   # Applet capabilities & permissions declaration
├── package.json                    # Dependencies and dev/build/start scripts
├── server.ts                       # Express backend server with Gemini fallback ladder
├── tsconfig.json                   # TypeScript compiler configuration
├── vite.config.ts                  # Vite build tooling with Tailwind CSS plugin
├── public/                         # Public static assets & favicon
└── src/
    ├── App.tsx                     # Main container, routing, and modal managers
    ├── main.tsx                    # React root entry point
    ├── index.css                   # Tailwind CSS imports & theme definitions
    ├── types.ts                    # Universal TypeScript data contracts
    ├── context/
    │   ├── AuthContext.tsx         # Firebase Auth, Google Sign-In & Profile Sync
    │   └── DataContext.tsx         # Real-time Firestore sync & statistics engine
    ├── lib/
    │   ├── firebase.ts             # Firebase app initialization & payload hygiene
    │   └── api.ts                  # Client proxy communicating with /api/* routes
    └── components/
        ├── LandingPage.tsx         # Modern SaaS landing & sign-in entry page
        ├── Sidebar.tsx             # Responsive navigation sidebar
        ├── Navbar.tsx              # Sticky header with breadcrumbs & user avatar
        └── views/
            ├── DashboardView.tsx   # Overview hub, fast action modals, quick prompts
            ├── ChatView.tsx        # Context-aware conversational AI companion
            ├── MemoryView.tsx      # Personal knowledge vault & category filters
            ├── GoalsView.tsx       # Ambition tracking & AI task decomposition
            ├── TasksView.tsx       # Actionable checklist & smart focus recommender
            ├── JournalView.tsx     # Introspective journal & AI reflection analysis
            ├── InsightsView.tsx    # Longitudinal second-brain trajectory reports
            └── SettingsView.tsx    # Persona tone, profile sync & data wipe controls
```

---

## 22. Future Improvements

- [ ] **Voice Interaction & Live API**: Integrate the Gemini Live API for real-time, low-latency spoken conversations with audio transcription and voice responses.
- [ ] **Vector Embeddings for Semantic Memory Retrieval**: Add pgvector / Cloud SQL integration for dense embedding similarity search across thousands of memory items.
- [ ] **Google Workspace Calendar & Tasks Integration**: Bidirectional sync between ALYA tasks and Google Calendar / Google Tasks using OAuth scopes.
- [ ] **Progressive Web App (PWA) Offline Mode**: Installable mobile and desktop experience with service workers and local caching.
- [ ] **Collaborative Goals (Shared Projects)**: Multi-user goal sharing with fine-grained role-based access control (RBAC).

---

## 23. License

This project is open-source and licensed under the [MIT License](LICENSE).

---

*Built with passion for the Google Cloud Run AI Challenge.*
