# Friend Search

A full-stack friend discovery / social matching web application currently being built with a modern React frontend and a Flask backend.

## About the Project

**Friend Search** is a full-stack web application intended to help users discover and connect with other people based on searchable profile data and account-based interactions.

At its current stage, the repository is structured as a **modern frontend + API backend architecture**:

- **Frontend:** built with **React**, **TypeScript**, and **Vite**
- **Backend:** built with **Flask**
- **Authentication support:** includes **bcrypt** for password hashing and **JWT** for token-based auth
- **Database:** includes a local **SQLite database file** (`friendsearch.db`)
- **CORS enabled:** frontend and backend are prepared to communicate across origins during development

## Current Project Highlights
- **Modern React Frontend**
  - Built with **React 19**, **TypeScript**, and **Vite**
  - Configured with ESLint for code quality
  - Ready for fast local development and production builds

- **Python Flask Backend**
  - Lightweight API server built with **Flask**
  - Runs locally on **port 5000**

- **Authentication Foundations**
  - **bcrypt** included for secure password hashing
  - **PyJWT** included for token-based authentication

- **Cross-Origin API Support**
  - **Flask-CORS** is installed, allowing frontend ↔ backend communication during development

- **Bundled Local Database**
  - Includes an SQLite database file: `friendsearch.db`

- **Demo Data Seeding**
  - The backend startup script calls `seed_demo_data()` before launching the app

##  Tech Stack

### Frontend
- **React 19**
- **TypeScript**
- **Vite**
- **ESLint**

### Backend
- **Python**
- **Flask**
- **Flask-CORS**
- **bcrypt**
- **PyJWT**

### Data Layer
- **SQLite** (`friendsearch.db`)

## Project Structure

```bash
friend-search/
│
├── backend/
│   ├── app/                # Flask application package
│   ├── friendsearch.db     # Local SQLite database
│   ├── Requirements.txt    # Python dependencies
│   ├── run.py              # Backend entry point
│   └── README.md
│
├── frontend/
│   ├── public/             # Static assets
│   ├── src/                # React source code
│   ├── package.json        # Frontend dependencies and scripts
│   ├── vite.config.ts      # Vite configuration
│   └── README.md
│
└── README.md
