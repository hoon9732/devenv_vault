@echo off
set "WORKSPACE_DIR=C:\Users\USER\Documents\code"
set "SSH_DIR=C:\Users\USER\.ssh"
set "SSH_KEY_PATH=%SSH_DIR%\github_devenv_vault"
set "SSH_EMAIL=hoon9732@gmail.com"
set "REPO_URL=git@github.com:hoon9732/devenv_vault.git"

echo Checking for workspace content...

rem Check if the workspace directory is empty (excluding .git)
dir /b "%WORKSPACE_DIR%" | findstr /v ".git" > nul
if %errorlevel% == 0 (
    echo Workspace contains files. Skipping clone.
) else (
    echo Workspace is empty or wiped. Proceeding with clone.

    rem Ensure .ssh directory exists
    if not exist "%SSH_DIR%" (
        echo Creating .ssh directory...
        mkdir "%SSH_DIR%"
    )

    rem Regenerate SSH key if not present or wiped
    if not exist "%SSH_KEY_PATH%" (
        echo Regenerating SSH key...
        ssh-keygen -t ed25519 -f "%SSH_KEY_PATH%" -C "%SSH_EMAIL%" -N ""
    )

    rem Create/Update SSH config file
    echo Host github.com > "%SSH_DIR%\config"
    echo   Hostname ssh.github.com >> "%SSH_DIR%\config"
    echo   Port 443 >> "%SSH_DIR%\config"
    echo   IdentityFile %SSH_KEY_PATH% >> "%SSH_DIR%\config"
    echo SSH config updated.

    echo Cloning repository...
    git clone "%REPO_URL%" "%WORKSPACE_DIR%"
    echo Repository cloned.
)

echo Restoration script finished.
pause
