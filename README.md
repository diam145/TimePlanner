# TimePlanner

A desktop application for managing employee schedules and teams. Built with a Python/Flask backend and an Electron frontend, it runs fully locally on Windows as a self-contained desktop app.

---

## Overview

TimePlanner is designed for small teams and managers who need a simple, offline schedule management tool. It runs a local Flask server on `127.0.0.1:5001` and stores all data in a local SQLite database — no cloud, no account required.

---

## Features

- Employee schedule creation and management
- Team management with member assignments
- Calendar view per employee
- Team schedule overview with color-coded shifts
- Excel export for schedules and reports
- Archive and reports management
- Auto-starting backend bundled with the desktop app
- Works fully offline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + Flask |
| Frontend | Electron (JavaScript) |
| Database | SQLite |
| Packaging | Electron Builder (Windows installer + portable) |
| API | REST (Flask → Electron) |

---

## Project Structure

```
TimePlanner/
├── backend/               # Python Flask server
│   └── app.py             # Main Flask app and API routes
├── frontend/              # Electron app
│   ├── main.js            # Electron main process
│   └── src/               # UI pages and renderer scripts
├── test_database.py       # Database tests
├── package.json           # Node.js config and build scripts
├── package-lock.json
└── LICENSE                # MIT License
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [Python](https://www.python.org/) 3.8 or higher
- Git

### Development Mode

1. Clone the repository:

```bash
git clone https://github.com/diam145/TimePlanner.git
cd TimePlanner
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Start the backend:

```bash
cd backend
python app.py
```

5. In a new terminal, start the Electron app:

```bash
npm start
```

### Build for Windows

```bash
# Full installer + portable
npm run build:win

# Portable only
npm run build:portable
```

Built files will appear in the `dist/` directory.

---

## Usage

Once launched, the app connects to the local Flask backend automatically. From the main window you can:

1. **Create and manage employees** — add team members and assign roles
2. **Build schedules** — assign shifts via the calendar view
3. **View team overviews** — color-coded team schedule at a glance
4. **Export to Excel** — generate reports and share schedules
5. **Archive records** — keep historical schedule data

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

**[@diam145](https://github.com/diam145)**
