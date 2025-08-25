#!/usr/bin/env python3
"""
TimePlanner Desktop Application Startup Script

This script ensures the Flask backend starts correctly when launched from Electron.
It handles environment setup and graceful error handling.
"""

import os
import sys
import time
import logging
from pathlib import Path

# Setup logging (force UTF-8 to avoid cp1252 encoding errors)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("timeplanner.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def check_dependencies():
    """Verify that required packages are available in the bundled exe."""
    required_packages = [
        "flask",
        "pandas",
        "openpyxl",
        "xlsxwriter",
        "flask_cors"
    ]

    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"{package} ... OK")
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        logger.error(f"Missing packages in bundle: {', '.join(missing_packages)}")
        logger.error("Please update PyInstaller build to include them.")
        sys.exit(1)


def setup_environment():
    """Setup the environment for the Flask application."""
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)

    sys.path.insert(0, str(backend_dir))

    # Set Flask env variables
    os.environ["FLASK_ENV"] = "production"
    os.environ["FLASK_APP"] = "app.py"

    logger.info(f"Working directory: {os.getcwd()}")
    logger.info(f"Python path: {sys.path[0]}")


def start_application():
    """Start the TimePlanner Flask application with Waitress in production."""
    try:
        logger.info("🚀 Starting TimePlanner application...")

        from app import app

        # If running inside PyInstaller (production), use Waitress
        if getattr(sys, 'frozen', False):
            from waitress import serve
            logger.info("Starting with Waitress (production mode)...")
            serve(app, host="127.0.0.1", port=5001)
        else:
            # Normal Flask dev server for debugging
            logger.info("Starting with Flask built-in server (development mode)...")
            app.run(
                host="127.0.0.1",
                port=5001,
                debug=True,
                use_reloader=True,
                threaded=True
            )

    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)


def main():
    logger.info("=" * 50)
    logger.info("TimePlanner Desktop Application Starting...")
    logger.info("=" * 50)

    try:
        setup_environment()
        check_dependencies()
        start_application()
    except KeyboardInterrupt:
        logger.info("Application stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
