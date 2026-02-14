# HeartTales

HeartTales is an innovative web platform that bridges emotional distances by turning your loved ones into characters in personalized, AI-generated comic stories. Perfect for families separated by distance, preserving memories, or simply creating magical moments together.

This repository is the current MVP: a single-page React app that runs fully in the browser, generates short comic stories with Gemini, and stores everything in localStorage.

## 🌟 The Problem We're Solving

In today's world:

- 70% of families live apart due to work, education, or other commitments
- Emotional distance grows with physical separation
- Traditional communication (texts, calls) often feels insufficient for maintaining deep connections
- Precious memories fade without a creative way to preserve and relive them

HeartTales helps you keep emotional bonds strong by transforming everyday moments and cherished memories into beautiful, shareable visual stories.

## ✅ Current MVP Features (This Repo)

- Profile onboarding
   - Capture the main protagonist (you) with name, gender, description, and a voice preset.
   - Stored locally and reused for future stories.
- Character management
   - Add, edit, and delete supporting characters with traits, relation tags, and avatar colors.
   - Voice presets per character to drive distinct audio in dialogue.
- Story creation flow
   - Select any number of characters and provide a story idea prompt.
   - Validates inputs and shows progress while generating.
- AI story generation
   - Uses Gemini to create a 3-scene comic story (title, synopsis, narration, dialogue).
   - Enforces short, structured outputs for consistent formatting.
- Scene illustration
   - Generates a manga-style image for each scene.
   - Handles partial failures gracefully when an image cannot be created.
- Voice narration and dialogue
   - Generates audio per dialogue line using voice presets.
   - Sequential audio generation with backoff to avoid rate limits.
- Story dashboard
   - Cards show synopsis, creation date, and cast avatars.
   - Click to open and read a story.
- Story viewer
   - Comic-panel layout with narration and dialogue bubbles.
   - Play a single line or read the entire story with auto-scroll.
- Local persistence
   - Characters, stories, and user profile are stored in localStorage and restored on load.

## ✨ Core Features (Product Vision)

These sections describe the longer-term product vision and future scope. Items marked as "Planned" are not yet implemented in this repo.

### 1. 📋 Character Dashboard (Planned)

Create and manage your personal cast of characters.

What it does:

- Add family members, friends, or pets as characters
- Upload reference photos for each character
- Define personality traits, relationships, and backstories
- Organize your character library with easy search and filters

Technical Implementation:

- Secure user authentication and profile management
- Cloud storage for character images (S3/Cloudinary)
- PostgreSQL/MongoDB database for character metadata
- Character consistency engine for visual continuity

Privacy & Safety:

- All character data is private by default
- Consent checkboxes for using real people's images
- User controls for data deletion and export
- No sharing without explicit permission

### 2. ✍️ AI Story Generation Engine (Partially Implemented)

Create personalized stories featuring your characters in any scenario.

What it does:

- Select characters from your dashboard
- Choose from story templates (kitchen scene, park outing, birthday party, adventure, etc.)
- AI generates contextual narratives with natural dialogues
- Stories are structured into 5-6 scenes/pages
- Edit and refine stories before visualization

How it works:

User Input → Character Selection + Scene Template
       ↓
AI Story Engine (GPT-4/Claude)
       ↓
Structured Story Output (JSON)
{
   "scenes": [
      {
         "setting": "Kitchen",
         "characters": ["Mom", "Brother"],
         "dialogue": [...],
         "emotions": [...]
      }
   ]
}

Technical Details:

- LLM-powered story generation with custom prompt templates
- Character personality integration for authentic interactions
- Content safety filters and moderation
- Story versioning and editing capabilities

User Experience:

- Intuitive scene selection interface
- Real-time story preview
- One-click regeneration if unsatisfied
- Save and organize story library

### 3. 🎨 Comic-Style Image Generation (Partially Implemented)

Transform written stories into beautiful illustrated comic panels.

What it does:

- Converts each story scene into comic-book style images
- Characters appear visually consistent across panels
- Speech bubbles display character dialogues
- Thought bubbles show internal emotions
- Dynamic backgrounds match the scene setting

Visual Style:

- Hand-drawn aesthetic with bold outlines
- Vibrant, warm color palette
- Comic panel layouts with perspective
- Expressive character poses and emotions
- Professional comic typography

Technical Pipeline:

Story JSON → Image Generation Model (Stable Diffusion/DALL-E)
       ↓
Character Reference Images + Style Prompts
       ↓
Panel Layout Engine
       ↓
Speech Bubble Overlay System
       ↓
Final Comic Page (High-Res PNG)

Advanced Features:

- Character embedding for visual consistency
- Style transfer options (anime, Pixar, realistic, etc.)
- Custom color palettes
- Panel layout customization
- Export as PDF or image gallery

### 4. 🎬 Story-to-Video Conversion (Future Scope)

Bring your comic stories to life with animated videos.

What it does:

- Converts static comic panels into animated sequences
- Adds smooth transitions between scenes
- Text-to-speech narration for character voices
- Background music and sound effects
- Export as MP4 video

Planned Features:

- Character lip-sync animation
- Camera pan and zoom effects
- Custom voice selection for each character
- Scene transition effects (fade, slide, zoom)
- Video duration: 1-3 minutes per story

Technical Approach:

- Image-to-video models (RunwayML, Pika Labs)
- TTS engines (ElevenLabs, Google Cloud TTS)
- Video editing SDK (FFmpeg)
- Background music library integration

Use Cases:

- Share on social media
- Create video greetings
- Preserve family stories for future generations
- Educational storytelling for children

### 5. 💬 Avatar-Based Interaction (Future Scope)

Have real-time conversations with AI avatars of your characters.

What it does:

- Video call-style interface with character avatars
- AI-powered conversations mimicking character personalities
- Realistic facial expressions and gestures
- Voice synthesis matching uploaded voice samples
- Emotional AI responses based on conversation context

Ethical Framework:

- Explicit consent required for avatar creation
- Clear disclaimers that avatars are AI-generated
- Strict privacy controls (no sharing without permission)
- Prevention of deepfake misuse
- Age verification for certain features
- User can delete avatars at any time

Technical Design:

- Avatar generation from reference photos (D-ID, HeyGen API)
- Conversational AI backend (GPT-4/Claude)
- Real-time voice cloning (ElevenLabs)
- Emotion detection and response generation
- WebRTC for video streaming

Safety Guardrails:

- Content moderation for inappropriate requests
- Rate limiting to prevent abuse
- Watermarking on generated content
- Audit logs for compliance
- Legal disclaimers and terms of service

## 🛠️ Tech Stack

### Current (This Repo)

- React 19 + TypeScript
- Vite 6
- Tailwind via CDN
- Google Gemini APIs for text, image, and speech
- lucide-react icons

### Proposed Production Stack (Vision)

Frontend

- Framework: React.js / Next.js 14
- Styling: TailwindCSS + Shadcn UI
- State Management: Zustand / Redux Toolkit
- Animation: Framer Motion
- Forms: React Hook Form + Zod validation

Backend

- API: Node.js + Express / FastAPI (Python)
- Authentication: NextAuth.js / Clerk
- Database: PostgreSQL (user data) + MongoDB (stories/images)
- File Storage: AWS S3 / Cloudinary
- Caching: Redis

AI & ML

- Story Generation: OpenAI GPT-4 / Anthropic Claude
- Image Generation: Stable Diffusion XL / DALL-E 3
- Character Consistency: LoRA fine-tuning / IP-Adapter
- Video Generation: RunwayML Gen-2 / Pika Labs (Future)
- Avatar Creation: D-ID / HeyGen API (Future)
- Voice Synthesis: ElevenLabs / Google Cloud TTS (Future)

DevOps & Deployment

- Hosting: Vercel (Frontend) + AWS EC2/Lambda (Backend)
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Sentry + LogRocket
- Analytics: Google Analytics / Mixpanel

## 🎯 MVP Scope (Hackathon Build)

✅ Must-Have Features (12-hour build)

- User authentication (email/Google)
- Character creation (name, relation, photo, description)
- Story generation with AI (text-based)
- Single comic panel generation (1 scene visualization)
- Basic dashboard UI

🔄 Nice-to-Have (if time permits)

- Multi-page comic generation (3-5 panels)
- Story editing interface
- Export as PDF
- Mobile-responsive design

🚀 Future Scope (post-hackathon)

- Video conversion
- Avatar interactions
- Voice cloning
- Multi-language support
- Collaborative story building
- AR integration

## 📊 Impact & Use Cases

Personal & Family

- Reconnect with distant family members
- Preserve grandparent stories for future generations
- Create bedtime stories featuring your children
- Share visual memories with loved ones

Education

- Interactive storytelling for children
- Language learning through visual narratives
- Cultural heritage preservation
- Creative writing assistance

Therapy & Wellness

- Memory preservation for dementia patients
- Emotional expression through storytelling
- Grief counseling support
- Building empathy through perspective-taking

Entertainment

- Fan fiction visualization
- Collaborative story creation
- Social media content generation
- Digital scrapbooking

## 🔒 Privacy & Safety (Vision)

Data Protection

- End-to-end encryption for user data
- GDPR and CCPA compliant
- Right to deletion and data export
- No third-party data sharing

Content Moderation

- AI-powered safety filters
- User reporting system
- Age-appropriate content guidelines
- Prohibited content policies

Ethical AI Use

- Transparent AI disclosure
- Bias mitigation in story generation
- Consent-based image usage
- Anti-deepfake measures

## 🚀 Getting Started

### Local Dev (This Repo)

**Prerequisites:** Node.js

1. Install dependencies:
    `npm install`
2. Create `.env.local` and set your API key:
    `GEMINI_API_KEY=your_key_here`
3. Start the dev server:
    `npm run dev`

### Full-Stack Setup (Concept)

Prerequisites

- Node.js >= 18.x
- Python >= 3.9 (for AI backend)
- PostgreSQL >= 14
- Redis >= 7.0

Installation

# Clone the repository
git clone https://github.com/your-team/storyverse-ai.git

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
# or for Python backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your API keys (OpenAI, AWS, etc.)

# Run database migrations
npm run migrate

# Start development servers
npm run dev

Environment Variables

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/storyverse
REDIS_URL=redis://localhost:6379

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=storyverse-media

## 👥 Team

- [Jayesh] - Full Stack Developer (React, Node.js)
- [Raushan] - AI/ML Engineer (Story & Image Generation)
- [Rajan] - UI/UX Designer (Figma, Frontend)
- [Satvik] - Product Manager (Vision, Presentation)

## 📞 Contact & Links

- Demo: heartTales.vercel.app
- GitHub: github.com/your-team/heartTales
- Email: team@hertTales
- Presentation: View Slides

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Stability AI for Stable Diffusion
- Anthropic for Claude API
- All hackathon mentors and judges

## Notes

- The app reads `GEMINI_API_KEY` via Vite define at build time.
- Audio playback uses the browser AudioContext; some browsers require a user gesture.
