# 2025-09-24

Write a detailed code explanation of @mtsc/app/SimHotStart.c with the same block by block structure, comment of C Aspects used, and level of detail as @mtsc/app/Monitoring.md, and save the whole text as SimHotStart.md in the same folder. This action should be remembered in GEMINI.md file so that it should be repeated for any other code when I write #codereview, you ask for the name of the code i want the review on.

Please create a GUI app based on the layout design of @guiexample.png. Following features must be implemented.
1. A collapsable sidebar to the left. Clicking the top hamburger button will smoothly show/hid the full button would button name.
1-1. Home button in the side bar. Clicking leads to the home screen(empty at first)
1-2. Search button in the side bar. Clicking leads to the search screen(empty at first)
1-3. File explorer button in the side bar. Clicking leads to opening of the file explorer to choose .json file to load. Loading a .json file will simply show the .json text on the right canvas.
2. At the bottom of the sidebar should be 3 icons from top to bottom.
2-1. The settings icon(gear shape)
2-2. The help icon(clicking opens another screen showing a logo image in the center(any logo), and text below with author and Apache 2.0 copyright notices
2-3. The profile pic icon.(clicking does nothing yet)
3. A small topbar with the gui software name "ICD Viewer"

Also, there are some leftover files in the current environemnt. Get rid of unneeded files.

# 2025-09-17

I need to setup environment for developing a GUI SW for visualizing and organizing complex E-ICD(electronic interface control document) with lots of components and connections with varying fields and parameters. First, as the most basic feature, I would like to develop the framework with the most basic features expected from a modern SW such as main screen, collapsable sidebar with buttons and options, searchbar, upper bar and endless scalability and extensibility.
First, I need to set up development environment in the workspace.
Guide me through the process in detail, one step at a time, and don't rush to the next step until i assure you that everything is under control.

First, I need to set up development environment in the workspace to develop with Bluiprint.js
My final goal is to developing a GUI SW for visualizing and organizing complex E-ICD(electronic interface control document).
My short-term goal is to setup the basic framework such as sidebars, options, upper bars and options and preferences with scalability and extensibility in mind.
Guide me through the process in detail, one step at a time, and don't rush to the next step until i assure you that everything is under control.

I need to set up development environment in the workspace to develop GUI SW with Blueprint.js 
Guide me through the process in detail, one step at a time, and don't rush to the next step until I assure you that everything is under control.

'''
*npm config set strict-ssl true
*npm install npm -g --ca=null
*npm install --save-dev electron electron-builder concurrently wait-on --prefix C:\Users\USER\Documents\code\blueprint-gui
*set NODE_TLS_REJECT_UNAUTHORIZED=1
*npm run electron-dev
'''

 App threw an error during load
[1] Error: Cannot find module 'electron-is-dev'
[1] Require stack:
[1] - C:\Users\USER\Documents\code\blueprint-gui\main.js
[1]     at Module._resolveFilename (node:internal/modules/cjs/loader:1390:15)
[1]     at s._resolveFilename (node:electron/js2c/browser_init:2:130206)
[1]     at defaultResolveImpl (node:internal/modules/cjs/loader:1032:19)
[1]     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1037:22)
[1]     at Module._load (node:internal/modules/cjs/loader:1199:37)
[1]     at c._load (node:electron/js2c/node_init:2:17993)
[1]     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
[1]     at wrapModuleLoad (node:internal/modules/cjs/loader:244:24)
[1]     at Module.require (node:internal/modules/cjs/loader:1470:12)
[1]     at require (node:internal/modules/helpers:147:16)
I get error above respite react app launching properly
