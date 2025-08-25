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

### Option 1: Automated Build (Recommended)

1. **Clone or download** this repository
2. **Run the build script**:
   ```batch
   build-desktop-app.bat
   ```
3. **Wait for the build to complete**
4. **Find your executable** in the `frontend/dist/` folder

### Option 2: Manual Build

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   # For installer and portable versions
   npm run build:win
   
   # For portable version only
   npm run build:portable
   ```

4. **Find the built files** in `frontend/dist/`

## Development

### Running in Development Mode

1. **Start the backend server**:
   ```bash
   cd backend
   python app.py
   ```

2. **Start the Electron app** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

### Development Scripts

- `npm start` - Start Electron in development mode
- `npm run dev` - Start with detailed logging
- `npm run build` - Build for all platforms
- `npm run build:win` - Build for Windows only
- `npm run pack` - Create unpacked directory

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

## Build Outputs

After building, you'll find these files in `frontend/dist/`:

1. **TimePlanner Setup.exe** - Windows installer
2. **TimePlanner-1.0.0-portable.exe** - Portable executable (no installation required)

## Distribution

### Installer Version
- **Pros**: Standard Windows installation, Start Menu shortcuts, uninstaller
- **Cons**: Requires admin privileges for installation
- **Use case**: Corporate deployment, permanent installation

### Portable Version
- **Pros**: No installation required, runs from any location, no admin privileges needed
- **Cons**: No automatic shortcuts, manual placement required
- **Use case**: USB deployment, temporary usage, restricted environments

## Customization

### Changing App Icon

1. **Create your icon**:
   - Format: ICO file for Windows
   - Sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
   
2. **Replace the icon**:
   - Save as `frontend/assets/icon.ico`
   - Also create `frontend/assets/icon.png` (512x512)

3. **Rebuild** the application

### Modifying App Information

Edit `frontend/package.json`:

```json
{
  "name": "your-app-name",
  "productName": "Your App Display Name",
  "version": "1.0.0",
  "description": "Your app description",
  "author": {
    "name": "Your Name",
    "email": "your-email@example.com"
  }
}
```

## Troubleshooting

### Common Issues

1. **"Backend server failed to start"**
   - Ensure Python is installed and in PATH
   - Check that all Python dependencies are installed
   - Verify Flask app runs independently: `cd backend && python app.py`

2. **"Build failed"**
   - Ensure Node.js and npm are installed
   - Delete `node_modules` and run `npm install` again
   - Check for disk space issues

3. **"Permission denied during build"**
   - Close any running instances of the app
   - Run command prompt as administrator
   - Check antivirus software (may block executable creation)

4. **"Cannot find Python executable"**
   - Install Python from python.org
   - Ensure Python is added to PATH during installation
   - Restart command prompt after Python installation

### Logs and Debugging

- **Backend logs**: Check `backend/timeplanner.log`
- **Electron logs**: Run with `npm run dev` for detailed output
- **Build logs**: Check console output during build process

## System Requirements

### Development
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for development environment

### Runtime (End Users)
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 2GB minimum
- **Storage**: 500MB for application and data

## Security Considerations

- The application runs a local Flask server on `127.0.0.1:5001`
- No external network access required for core functionality
- Data is stored locally in SQLite database
- Excel exports are saved to local file system

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review application logs
3. Create an issue on the GitHub repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.
