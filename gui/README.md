# ICDV - Interface Control Document Viewer

ICDV is a desktop application designed for viewing and managing Interface Control Documents (ICDs). It provides a user-friendly interface for developers and engineers to explore workspace directories, view file contents, and manage project-specific profiles and settings.

Built with Electron and React, it offers a modern, cross-platform experience.

---

## How to Run and Maintain

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js)

### 1. Installation

Clone the repository and install the required dependencies.

```bash
# Clone the repository
git clone <your-repository-url>
cd gui

# Install dependencies
npm install
```

### 2. Running in Development Mode

To run the application in a live-reloading development environment, use the following command. This will start the React development server and the Electron application simultaneously.

```bash
npm run electron:start
```

### 3. Building for Production

To build a distributable installer for your platform, run the following command. The packaged application will be located in the `dist` folder.

```bash
npm run electron:build
```

### 4. Code Formatting

This project uses Prettier for automated code formatting. To format all files, run:

```bash
npx prettier --write .
```

---

## Version Update Notes

### v0.0.3 (Current)
*   **Major Refactor:** Reorganized the entire codebase to align with industry-standard practices for Electron + React applications.
    *   Separated code by Electron process (`main`, `preload`, `src` for renderer).
    *   Restructured the React `src` directory to be feature-based for better scalability.
*   **Added Code Quality Tools:**
    *   Integrated **Prettier** for automated, consistent code formatting.
    *   Added **ESLint** configuration (`.eslintrc.cjs`, `.eslintignore`) to enforce code quality and catch errors.
    *   Included an **`.editorconfig`** file for consistent editor settings.
*   **Bug Fixes:** Resolved all ESLint warnings and errors, including adding `prop-types` validation to all components.

### v0.0.2
*   General stability improvements and minor bug fixes.
*   Enhanced IPC communication between the main and renderer processes.

### v0.0.1
*   Initial release of the ICDV application.
*   Core features implemented:
    *   File explorer for workspace navigation.
    *   File content viewer.
    *   Application settings and user profile management.