@echo off
echo Temporarily disabling strict SSL for npm...
call npm config set strict-ssl false
echo.
echo Temporarily disabling TLS unauthorized rejections for Node.js...
set NODE_TLS_REJECT_UNAUTHORIZED=0
echo.
echo Deleting node_modules directory...
rmdir /s /q node_modules
echo.
echo Deleting package-lock.json file...
del package-lock.json
echo.
echo Running npm install to restore dependencies...
call npm install
echo.
echo Re-enabling strict SSL for npm...
call npm config set strict-ssl true
echo.
echo Unsetting NODE_TLS_REJECT_UNAUTHORIZED...
set NODE_TLS_REJECT_UNAUTHORIZED=
echo.
echo Recovery process complete.
pause
