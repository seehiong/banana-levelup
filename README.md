# Banana Level Up: Dynamic AI Avatar Creation & Progression

Transform user experience with real-time avatar creation, dynamic editing, and visual progression via natural language and multimodal fusion.

This project is a submission for the Nano BANANA Hackathon by Google and Kaggle. It is a proof-of-concept web application that showcases the power of Gemini for dynamic, interactive AI-powered avatar creation.

<!-- ![Banana Hero](https://storage.googleapis.com/gemini...) -->

Banana Level Up is an interactive web demo that unleashes Gemini's strengths for AI-powered avatar creation and progression. Users select a starter avatar, then use natural language to decorate and evolve their character—gaining new visual badges and cosmetic upgrades as milestones are achieved.

Every edit is dynamic, blending user input and Gemini’s world knowledge to highlight real-time change. Our application leverages Gemini’s unique capabilities:

- **Consistent Character Rendering**: Maintaining character identity through various progression stages.
- **Targeted Local Edits**: Allowing for precise personalization of appearance and accessories.
- **Style Fusion**: Mixing and matching visual styles to create unique avatars.

The project demonstrates natural language photo editing, automated creative workflows, and consistent storytelling, delivering a magical visual experience not possible with simple text-to-image models.

## ✨ Core Features

- **Starter Avatars**: Choose from a selection of base characters created as high-quality, photorealistic 3D collectible figurines:
  - **Banana Splash** (Playful Otter Pup)
  - **Banana Scout** (Curious Capybara)
  - **Desert Dash** (Clever Fennec Fox)
  - **Bamboo Breeze** (Chill Red Panda)
  - **Code Monkey** (Tech Guru)
  - **Artisan Owl** (Creative Master)
  - **Captain Canary** (Brave Adventurer)
  - **Banana Sage** (Wise Dragon)
- **Natural Language Editing**: Use simple text prompts to modify your avatar (e.g., "give him a golden banana sword" or "add a glowing aura").
- **Visual Progression**: As characters "level up" through interaction, they automatically receive visual upgrades like badges or new armor.
- **Gemini-Powered**: Every avatar generation and modification is powered by Google's Gemini models.

## 🐵 Base Character Descriptions

Each character reflects a specific age and user demographic with consistent artistic style and photorealistic 3D collectible figurine quality. The banana theme evolves from playful patches to sophisticated accessories, showing character progression.

#### Banana Scout (Capybara)
A curious and friendly capybara in a scout vest, holding a banana like a new discovery. Represents youthful curiosity and exploration.

#### Sprout Mole (Gardener)
A shy mole with a banana leaf sprouting from its head, holding a prized banana. Represents growth and discovery.

#### Desert Dash (Fennec Fox)
A clever fennec fox with huge ears, a yellow hoodie, and a messenger bag. Represents a sharp and resourceful mind.

#### Bamboo Breeze (Red Panda)
A chill red panda enjoying a banana-flavored boba tea. Represents social connection and enjoying the moment.

#### Code Monkey (Tech Guru)
A clever capuchin monkey with glasses and a hoodie, expertly typing on a miniature laptop. Represents mastery of technology.

#### Artisan Owl (Creative Master)
A wise snowy owl in an artist's apron, holding a paintbrush. Represents artistic skill.

#### Captain Canary (Adventurer)
A brave canary in a captain's hat and aviator jacket, holding a treasure map. Represents leadership and adventure.

#### Banana Sage (Dragon)
A wise, ancient golden dragon with banana-shaped horns, guarding a mystical banana crystal. Represents the pinnacle of wisdom.

## 🛠️ Tech Stack

- **Frontend**: React with Vite
- **AI/ML**: Google Gemini API (`@google/genai`)
- **Styling**: (To be added)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/banana-levelup.git
    cd banana-level-up
    ```

2.  **Set up your environment variables:**
    Create a `.env` file in the root of the project and add your Gemini API key:
    ```text
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  **Install dependencies and generate base characters:**
    Run the combined setup script. This will install all `npm` packages and then run the script to generate the initial character images.
    The base images are required before you can generate rotations.
    ```bash
    # Installs dependencies AND generates base character images
    npm run setup 
    ```
    The images are saved in the `public/` directory.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

5.  **(Optional) Generate Character Rotations:**
    To generate the 360° rotational views for the characters, run the `setup-rotations` script. **Note:** You must generate the base characters first (see step 3).
    ```bash
    # Generate rotations for ALL characters
    npm run setup-rotations
    # Or, generate for a single character (e.g., sprout-mole)
    npm run setup-rotations -- sprout-mole
    ```

### Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally.
- `npm run setup`: Installs dependencies and generates base character images.
- `npm run setup-basechar`: Generates only the base character images (useful if you've already installed dependencies).
- `npm run setup-rotations`: Generates 360° rotational views for characters.