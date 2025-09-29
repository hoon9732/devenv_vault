@echo off
set "WORKSPACE_DIR=C:\Users\USER\Documents\code"
set "SSH_DIR=C:\Users\USER\.ssh"
set "SSH_KEY_PATH=%SSH_DIR%\github_devenv_vault"
set "SSH_EMAIL=hoon9732@gmail.com"
set "REPO_URL=git@github.com:hoon9732/devenv_vault.git"
REM --- IMPORTANT ---
REM Set DEFAULT_BRANCH to your repository's default branch name (e.g., 'main' or 'master').
REM If your default branch is 'master', change the line below to: set "DEFAULT_BRANCH=master"
set "DEFAULT_BRANCH=main"

echo Setting up workspace...
pause

REM Navigate to the workspace directory
cd "%WORKSPACE_DIR%" || (
    echo Error: Could not change directory to "%WORKSPACE_DIR%". Exiting.
	pause
    goto :end
)

REM Check if a local git repository exists
if exist ".git" (
    echo Local git repository found.
    echo Fetching all remote changes...
    git fetch --all
    if %errorlevel% neq 0 (
        echo Warning: git fetch --all encountered an error. Proceeding with reset.
    )
    echo Resetting local branch to match "%DEFAULT_BRANCH%" on origin...
    git reset --hard origin/%DEFAULT_BRANCH%
    if %errorlevel% equ 0 (
        echo Local repository successfully updated to match remote.
    ) else (
        echo Error updating local repository. Please check git status.
    )
	pause
) else (
    echo No local git repository found.
    
    REM If .git is missing, we need to clone.
    REM Before cloning, ensure the directory is clean.
    REM Check if the directory is empty. If not, initialize git and clean.
    dir /b > nul
    if %errorlevel% equ 0 (
        echo Workspace directory is not empty. Initializing git and cleaning...
        git init
        if %errorlevel% equ 0 (
            echo Git repository initialized.
            echo Cleaning workspace directory (removing untracked files/folders)...
            git clean -fdx
            if %errorlevel% equ 0 (
                echo Workspace cleaned.
            ) else (
                echo Warning: git clean -fdx encountered an error. Proceeding with cloning.
            )
        ) else (
            echo Error: Failed to initialize git repository in "%WORKSPACE_DIR%".
            echo Please manually clear the directory and re-run the script.
			pause
            goto :end
        )
    ) else (
        echo Workspace directory is empty.
    )

    REM Ensure .ssh directory exists
    if not exist "%SSH_DIR%" (
        echo Creating .ssh directory...
        mkdir "%SSH_DIR%"
    )

    REM Regenerate SSH key if not present or wiped
    if not exist "%SSH_KEY_PATH%" (
        echo Regenerating SSH key...
        ssh-keygen -t ed25519 -f "%SSH_KEY_PATH%" -C "%SSH_EMAIL%" -N ""
    )

    REM Create/Update SSH config file
    echo Host github.com > "%SSH_DIR%\config"
    echo   Hostname ssh.github.com >> "%SSH_DIR%\config"
    echo   Port 443 >> "%SSH_DIR%\config"
    echo   IdentityFile %SSH_KEY_PATH% >> "%SSH_DIR%\config"
    echo SSH config updated.

    echo Cloning repository "%REPO_URL%" into "%WORKSPACE_DIR%"...
    git clone "%REPO_URL%" .
    if %errorlevel% equ 0 (
        echo Repository cloned successfully.
    ) else (
        echo Error cloning repository. Please check the URL and your SSH setup.
    )
)

:end
echo Restoration script finished.
pause
