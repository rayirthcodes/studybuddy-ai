
# StudyBuddy AI 📚

An AI-powered study companion that helps students learn from their own study material.

## Features

- **Document Upload:** Upload PDF and DOCX files and extract study notes.
- **AI Tutor:** Ask questions about your notes and receive AI-generated explanations.
- **Quick Revision Notes:** Generate concise, exam-focused revision summaries.
- **AI Quiz Generator:** Create five multiple-choice questions, check your answers, and review explanations.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Ollama
- Gemma 3 4B
- unpdf
- Mammoth.js

## Getting Started

### Prerequisites

- Node.js and npm
- Ollama installed locally
- The `gemma3:4b` model downloaded in Ollama

### Installation

Clone the repository:

```bash
git clone https://github.com/rayirthcodes/studybuddy-ai.git
cd studybuddy-ai
```

Install dependencies:

```bash
npm install
```

Download the model if you have not already:

```bash
ollama pull gemma3:4b
```

Start Ollama, then run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## How It Works

Users provide study notes by pasting text or uploading a document. The application extracts document text and sends the material to a locally running Gemma model through Ollama for tutoring, revision summaries, and quiz generation.

## AI Contribution

Gemma 3 4B powers the AI tutoring, revision-summary generation, and quiz-generation workflows. The application connects to the model through Ollama.

## License

See the LICENSE file.
