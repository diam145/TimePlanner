# TimePlanner Desktop Application

TimePlanner is a comprehensive employee schedule management application built with Flask backend and Electron frontend, packaged as a Windows desktop application.

## Features

- ✅ Employee schedule management
- ✅ Team management with member assignments
- ✅ Excel export functionality
- ✅ Calendar view for individual employees
- ✅ Team schedule overview with color coding
- ✅ Reports and archive management
- ✅ Desktop application with auto-starting backend

## Prerequisites

Before building the desktop application, ensure you have:

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Python** (version 3.8 or higher)
   - Download from: https://python.org/
   - Verify installation: `python --version`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Quick Start

### Option 1: 
1. **Build the application**:
   ```bash
   # For installer and portable versions
   npm run build:win
   
   # For portable version only
   npm run build:portable
   ```

2. **Find the built files** in `dist/`

## Development

### Running in Development Mode

1. **Start the backend server**:
   ```bash
   cd backend
   python app.py
   ```

2. **Start the Electron app** (in a new terminal):
   ```bash
   npm start
   ```

## Application Structure

```
TimePlannerFlask/
├── backend/                 # Flask backend server
│   ├── app.py              # Main Flask application
│   ├── startup.py          # Production startup script
│   ├── requirements.txt    # Python dependencies
│   └── core/              # Core application modules
├── frontend/              # Electron frontend
│   ├── main.js           # Main Electron process
│   ├── package.json      # Node.js dependencies & build config
│   ├── error.html        # Error fallback page
│   └── assets/           # Application icons and resources
└── build-desktop-app.bat # Automated build script
```

## Security Considerations

- The application runs a local Flask server on `127.0.0.1:5001`
- No external network access required for core functionality
- Data is stored locally in SQLite database
- Excel exports are saved to local file system

## License

This project is licensed under the MIT License - see the LICENSE file for details.
