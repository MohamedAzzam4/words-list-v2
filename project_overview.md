# German Mastery Portal - Project Overview

This document serves as a comprehensive summary of the German Mastery Portal application. It is intended to provide context, design philosophy, and architectural logic for future AI assistants and developers working on the codebase.

## 1. Purpose of the Website
The **German Mastery Portal** is a comprehensive, gamified web application designed to help users learn and memorize German vocabulary efficiently. It provides structured, level-specific learning paths (based on CEFR levels like A1, A2, B1, B2) featuring massive vocabulary sets categorized into thematic units (e.g., Greetings, Numbers & Colors). The goal is to move users from passive reading to active recall through interactive features, flashcards, and quizzes.

## 2. UI/UX Theme & Colors

### Design Philosophy
The application employs a modern, **glassmorphic**, and highly dynamic design language. It prioritizes a premium, sleek feel that avoids generic or basic MVP aesthetics.
- **Visual Elements**: Extensive use of `backdrop-filter: blur` (glassmorphism), subtle gradients, soft drop-shadows, rounded corners (`border-radius`), and custom, thin scrollbars.
- **Micro-interactions**: Smooth hover states, transition animations, and dynamic pulse effects to make the interface feel responsive and alive.
- **Iconography**: Clean, professional SVG icons (replacing outdated emojis) for UI actions like checking off known words.

### Color Palette
- **Primary Theme**: A rich, deep indigo/purple base that feels educational yet modern.
- **Light Mode**: Clean white/off-white content backgrounds (`#ffffff`, `#f9fafb`) contrasted with a persistent dark indigo sidebar gradient (`#1E1B4B` to `#312E81`).
- **Dark Mode**: Deep midnight blues and slate greys (`#0f172a`, `#1e293b`) for reduced eye strain, while maintaining vibrant accent colors.
- **Functional Accents**:
  - **Primary/Action**: Indigo/Violet (`#6366f1` / `#818cf8`)
  - **Success/Known**: Emerald Green (`#10b981` / `var(--success)`)
  - **Learning/Warning**: Rose/Amber
- **Level-Specific Branding**:
  - A1: Blue
  - A2: Sky Blue
  - B1: Emerald
  - B2: Purple

### Typography
- Modern, clean sans-serif typography (e.g., **Poppins**, Inter) is utilized to ensure maximum readability for foreign language characters and a sleek, contemporary look.

## 3. Actual UX (User Experience)

### Navigation & Layout
- **Sidebar Hub**: A persistent, responsive left-side navigation bar acts as the central hub. It houses the level title, user authentication status, unit selection, Dashboard, Leaderboard, and Trophy Shelf.
- **Mobile Responsiveness**: On mobile devices, the sidebar intelligently converts into an off-canvas menu toggleable via a top hamburger icon, maximizing screen real estate for learning content.

### Learning Workflows
1. **Landing Page (`index.html`)**: A visually striking entry point where users select their target language level (e.g., A1).
2. **Glossary View**: The default learning view. A clean data table displaying the German word, English translation, word type, and example sentences. Users can use "Hide & Guess" toggles to hide specific columns (e.g., hide English) to test their memory directly on the table.
3. **Flashcard Mode**: An immersive, spaced-repetition-style view. Users flip cards to reveal translations and mark them as "Known" (SVG Check) or "Still Learning" (SVG Cross).
4. **Instant Feedback**: Progress bars at the top of the screen and within the sidebar update dynamically as users learn words.

## 4. Architecture & Logic

### Tech Stack
- **Frontend**: Pure Vanilla HTML, CSS, and JavaScript. The project intentionally avoids heavy frameworks (like React or Vue) to remain incredibly fast, lightweight, and easy to run locally.
- **Data Structure**: Vocabulary data is decoupled from the UI logic. It is loaded dynamically via configuration files (e.g., `js/levels/a1.config.js`).
- **Data Identifiers**: Words are tracked using a deterministic string-based ID system (e.g., `"1-0"`, `"1-1"` representing Unit-Index), which safely migrated from a legacy numeric index system.

### State Management & Storage
- **Local Storage**: Primary fast-access storage. User progress (known words, flashcard errors, quiz scores) is saved locally for immediate UI updates and offline capability.
- **Cloud Sync (Firebase)**: Integrated Firebase Authentication (Google & Email) and Firestore Database. When a user logs in, their local progress is seamlessly merged and synced to the cloud, allowing cross-device continuity.

## 5. Core Features List
- **Multi-Level Support**: Distinct environments for different CEFR levels (A1, A2, etc.).
- **Interactive Glossary Table**: Sortable vocabulary list with interactive "Hide & Guess" column masking for active recall.
- **Flashcard Engine**: Flippable cards with "Known/Learning" categorization logic.
- **Article Quiz System**: Specialized quizzes targeting the memorization of German noun genders (der/die/das).
- **Text-to-Speech (TTS)**: Built-in audio pronunciation for German vocabulary.
- **Authentication System**: Secure Google and Email/Password sign-in.
- **Cloud Synchronization**: Automatic backup and syncing of user progress to Firebase.
- **Gamification Dashboard**: Detailed visual statistics showing progress percentages and learned word counts.
- **Global Leaderboard**: Competitive ranking system against other platform users.
- **Trophy Shelf**: Unlockable achievements based on specific learning milestones.
- **Theme Switcher**: Fully functional Dark/Light mode toggle with persistent user preference.
- **Custom UI Components**: Custom scrollbars, glassmorphic cards, dynamic progress tracks, and professional SVG iconography.

## 6. File Structure
The project follows a clean, decoupled structure separating UI styling, core logic, and vocabulary data:

```text
/
├── index.html              # Landing page (Level Selection)
├── level.html              # Main Single-Page Application for learning (loads level dynamically)
├── css/
│   └── core.css            # Centralized stylesheet (variables, glassmorphism, components)
└── js/
    ├── core/               # Core Engine (Level-agnostic logic)
    │   ├── app.js                  # Main entry point, state initialization, Firebase setup
    │   ├── auth-service.js         # Google/Email authentication handlers
    │   ├── flashcards.js           # Flashcard UI interactions and spaced-repetition logic
    │   ├── glossary.js             # Vocabulary table generation and filtering logic
    │   ├── leaderboard-service.js  # Global user rankings and fetching
    │   ├── nav-service.js          # Dynamic sidebar generation and unit navigation
    │   ├── quiz.js                 # Article (der/die/das) quiz system
    │   ├── stats-service.js        # Progress tracking and dashboard statistics
    │   ├── storage.js              # LocalStorage read/write and backup operations
    │   ├── trophies.js             # Achievement evaluation and Trophy Shelf rendering
    │   ├── tts.js                  # Text-to-Speech audio integration
    │   └── utils.js                # Helper functions (Sanitization, ID generation)
    └── levels/             # Vocabulary Data Configurations
        └── a1.config.js    # A1 specific vocabulary data and configuration settings
```
