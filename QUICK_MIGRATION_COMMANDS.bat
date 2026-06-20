@echo off
echo ======================================
echo QUICK BACKEND MIGRATION
echo ======================================
echo.

REM Copy entire backend folder
echo Copying backend files...
xcopy "c:\Users\THINKPAD\Desktop\CRM tool\CRM-system\backend\*" "c:\Users\THINKPAD\Desktop\New CRM\xtreativecrm-tool\backend\" /E /I /Y /H

echo.
echo ======================================
echo MIGRATION COMPLETE!
echo ======================================
echo.
echo Next Steps:
echo 1. Open New CRM in VS Code
echo 2. Run: cd backend
echo 3. Run: npm install
echo 4. Copy .env file manually
echo 5. Run: npm start
echo.
pause
