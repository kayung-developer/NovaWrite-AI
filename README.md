# NovaWrite AI - Premier AI Writing Assistant

NovaWrite AI is a web-based application designed to be an intelligent partner for crafting high-quality, engaging content. It leverages the power of modern AI models (like GPT-4, Gemini, Claude, and DeepSeek) through Firebase Cloud Functions to offer a rich writing experience across numerous templates and languages.

**Live Demo (Conceptual):** [Link to your deployed app if available]

## Features

*   **AI-Powered Content Generation:**
    *   Utilizes cutting-edge AI models for tailored content creation.
    *   Generates plagiarism-free, grammatically correct text.
*   **Extensive Template Library:**
    *   Access 150+ pre-designed templates (mock data, extensible) for various use cases:
        *   Blog posts (outlines, sections)
        *   Social media ad copy
        *   SEO meta descriptions
        *   E-commerce product descriptions
        *   White paper introductions
        *   Job descriptions
        *   Technical documentation snippets
        *   Educational course modules
    *   Templates are categorized and searchable.
    *   Credit costs associated with each template.
*   **Multilingual Support:**
    *   Generate and (conceptually) translate content in over 140 languages (mock data, extensible).
    *   Language availability tied to user subscription plans.
*   **Proofreading & Editing:**
    *   AI-powered proofreading to enhance clarity, professionalism, and impact.
    *   Suggestions for improvement (conceptual, basic implementation provided).
    *   Feature availability based on user plan.
*   **User Authentication & Management:**
    *   Secure user registration and login using Firebase Authentication (Email/Password).
    *   User profiles stored in Firestore, including username, email, subscription plan, and AI credits.
*   **Subscription Plans & Credits:**
    *   Flexible tiered pricing plans (Basic, Premium, Ultimate).
    *   Each plan offers different levels of access to templates, languages, AI models, and monthly credits.
    *   Users can switch between plans.
    *   AI credit system to manage usage (unlimited credits for Ultimate plan with fair use policy).
*   **AI Model Selection (Ultimate Plan):**
    *   Ultimate plan users can choose their preferred AI model (GPT-4, Gemini Pro, Claude 2, DeepSeek Coder).
*   **Responsive Design:**
    *   User interface adapts to different screen sizes (desktop, tablet, mobile).
*   **Theme Toggle:**
    *   Switch between light and dark mode for user preference.
*   **Real-time UI Updates:**
    *   Dynamic display of user credits, plan information, and writer interface access based on authentication state.
*   **Interactive Modals:**
    *   Smooth modal dialogs for login, signup, and template library browsing.
*   **Toast Notifications:**
    *   User-friendly feedback for actions like login, signup, content generation, errors, etc.

## Tech Stack

*   **Frontend:**
    *   HTML5
    *   CSS3 (with CSS Variables for theming)
    *   Vanilla JavaScript (ES6+)
*   **Backend (Serverless):**
    *   Firebase
        *   **Firebase Authentication:** For user sign-up and login.
        *   **Cloud Firestore:** NoSQL database for storing user profiles, plans, and credits.
        *   **Cloud Functions for Firebase:** For backend logic, including:
            *   Securely calling third-party AI model APIs.
            *   Managing AI credit deductions.
            *   Handling content generation and proofreading requests.
*   **AI Models (Conceptual Integration - Requires API Keys & Setup):**
    *   GPT-4 (OpenAI)
    *   Gemini Pro (Google)
    *   Claude 2 (Anthropic)
    *   DeepSeek Coder

## Project Structure (Conceptual)
novawrite-ai/
├── index.html # Main application file
├── functions/ # Firebase Cloud Functions
│ ├── index.js # Main functions file (or .ts)
│ ├── package.json # Dependencies for functions
│ └── ... # Other function-related files
├── firebase.json # Firebase project configuration
├── firestore.rules # Firestore security rules
└── README.md # This file


## Getting Started

### Prerequisites

*   Node.js and npm (or yarn) installed.
*   Firebase CLI installed: `npm install -g firebase-tools`
*   A Firebase project.
*   API keys for the AI models you intend to use (e.g., OpenAI, Google AI Studio).

### Setup Instructions

1.  **Clone the Repository (or create files based on provided code):**
    ```bash
    git clone https://github.com/your-username/novawrite-ai.git
    cd novawrite-ai
    ```

2.  **Firebase Project Setup:**
    *   Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   Add a Web App to your project and copy the `firebaseConfig` object.
    *   Paste this `firebaseConfig` into the `<script>` section of `index.html`.
    *   Enable **Authentication** (Email/Password provider).
    *   Enable **Cloud Firestore** (start in test mode, then secure with `firestore.rules`).
    *   Enable **Cloud Functions** (you might need to upgrade to the Blaze plan, but it has a generous free tier).

3.  **Configure Firebase CLI:**
    *   Log in to Firebase: `firebase login`
    *   Initialize Firebase in your project directory (if you haven't cloned, create a `functions` directory first):
        ```bash
        firebase init functions
        ```
        *   Choose "Use an existing project" and select your Firebase project.
        *   Select JavaScript (or TypeScript if you adapt the functions).
        *   Agree to install dependencies.

4.  **Set AI API Keys for Cloud Functions:**
    *   Store your AI API keys securely using Firebase environment configuration. Open a terminal in the project root:
        ```bash
        firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY" googleai.key="YOUR_GOOGLE_AI_KEY" # Add others as needed
        ```
    *   Access these in `functions/index.js` using `functions.config().openai.key`.

5.  **Implement Cloud Functions Logic:**
    *   The provided JavaScript in `index.html` includes `contentGenerationService` which expects Cloud Functions named `generateContent` and `proofreadContent`.
    *   You need to implement the actual logic within `functions/index.js` to:
        *   Receive requests from the client.
        *   Validate user authentication and authorization (check plan, credits).
        *   Call the respective AI model APIs using the stored API keys.
        *   Process the AI model's response.
        *   Deduct credits from the user's profile in Firestore.
        *   Return the result to the client.
    *   Refer to the example structure provided in the previous AI responses for `functions/index.js`.

6.  **Deploy Cloud Functions:**
    *   From your project root:
        ```bash
        firebase deploy --only functions
        ```

7.  **Configure Firestore Security Rules:**
    *   Update `firestore.rules` with appropriate security rules to protect user data.
    *   Deploy the rules:
        ```bash
        firebase deploy --only firestore:rules
        ```

8.  **Run the Application:**
    *   Open `index.html` in your web browser.
    *   Alternatively, you can use Firebase Hosting to deploy the frontend:
        ```bash
        firebase init hosting
        # Configure public directory (e.g., current directory '.')
        firebase deploy --only hosting
        ```

## Usage

1.  **Sign Up / Login:** Create an account or log in with existing credentials.
2.  **Navigate Sections:** Use the navigation bar to explore Home, Features, Pricing, and the Writer.
3.  **Choose a Plan (Optional):** Select a subscription plan from the Pricing section. New users default to the "Basic" plan.
4.  **Access the AI Writer:**
    *   Go to the "Write" section.
    *   Enter a **Content Topic/Prompt**.
    *   **Browse Templates:** Click to open the template library, search, and select a template relevant to your needs. Template availability and credit costs are displayed.
    *   Select the desired **Language**.
    *   If on the "Ultimate" plan, select your preferred **AI Model**.
    *   Click **Generate Content**. The AI will generate text based on your inputs. Credits will be deducted.
    *   Use the **Proofread & Edit** button to get AI-powered suggestions on the generated content.
5.  **Manage Account:**
    *   View your current plan and remaining credits in the navigation bar.
    *   Log out when finished.

## Future Enhancements (Conceptual)

*   **Team Collaboration Tools:** Allow multiple users to work on documents together.
*   **API Access:** Provide an API for developers to integrate NovaWrite AI into other applications.
*   **Custom Templates:** Allow users (especially on higher-tier plans) to create and save their own templates.
*   **Advanced Translation Features:** More robust translation capabilities.
*   **Plagiarism Checker Integration.**
*   **Version History for Generated Content.**
*   **Integration with Cloud Storage (e.g., Google Drive, Dropbox) for saving documents.**
*   **More sophisticated AI model routing based on task complexity and plan.**

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information (if you add one).

## Acknowledgements

*   Firebase Team
*   Providers of the AI models (OpenAI, Google, Anthropic, etc.)
*   (Any other libraries or resources used)

---

**Note:** This README assumes you will be implementing the backend Cloud Functions. The provided HTML/JS is primarily the frontend and client-side logic that *calls* these backend functions. The core AI generation happens in the cloud.
