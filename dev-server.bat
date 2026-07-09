@echo off
cd /d "%~dp0"
set PORT=5502
echo.
echo [pages dev server]
echo   Home:  http://127.0.0.1:%PORT%/index.html
echo   Blogs: http://127.0.0.1:%PORT%/blogs/
echo   SAGE:  http://127.0.0.1:%PORT%/blogs/sage/flow-guide.html
echo.
echo If Live Server is already on 5500, use this instead.
echo Press Ctrl+C to stop.
python -m http.server %PORT%
