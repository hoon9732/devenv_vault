# 2025-09-30

Main Goal: Create a GUI for ICD(Interface Control Document) visualization, analysis and editing.
Major Requirement: The resulting software should be responsive and light(resource-wise), also robust and open for later development.
Current state: I have started developing the most basic UI elements based on react, electron, blueprint.js in a npm-based environment.
I have concluded that the react based GUI is light and modern, and might be visually simple. However, I still cannot decide how to develop the actual back-end of the SW, which is the core. I have found out about the concept of MBSE development principle done by software like CATIA Magic, which enables a smooth process form UML 2 system diagram to actual simulation and modeling.

Back-end Requirement: My first goal is to choose the appropriate coding language and data saving format(XML or json) for saving E-ICD(Electrical ICD) or D-ICD(Digital ICD) elements, which saves numerous sheet data for nodes and links in between(signal id, voltage, signal type etc.) So I am imagining a robust back-end for a software where you can easily create a node on a blank diagram and add unlimited amount of properties as as a sheet and unlimited levels of subproperties within. And also be able to connect the nodes with a simple drag-and-drop mouse movement, which forms a orthogonal line in between. And the line can also be edited of its numerous properties. You can either edit the diagram in diagram mode or the sheet mode, and can import or export it in numerous extensions(ex: .xls for sheet, .dwg for diagram)

My superior recommends C# for back-end development. Would it be a good option? Or would you suggest otherwise?
The frontend is developed on electron, so I am not sure how to connect the backend with it? 

Development environment factors: Due to the unstable current development environment, where the developing PC regularly wipes its user-edited files on reboot for security reasons.So the development environment better be light, so that i can redownload the exact environment every time of PC reboot.

# 2025-09-26

So the workspace button is now very crucial. We need to implement a more complex feature.
1. clicking the workspace button would open up secondary sidebar with only a simple rectange button "Open Workspace" on the top. Clicking the button would open up file explorer window which will make us choose the folder of default workspace that the whole app is working on. 
2. After the workspace is chosen, the secondary sidebar should work as an in-app file explorer as in modern vscode app. The folders and files should be shown in icons and names, and should be structured as a list. They should be collapsable by clicking '>' or 'V' shaped icons left of the left of the file/folder icon as in vscode.
3. After any workspace is loaded, there should be a small topbar of icons on top of the secondary sidebar(now called "explorer sidebar") which has icons for 'open new workspace', 'create new file', 'create new folder'(but they have icons only), and a simple close 'X' button to the very right of the explorer sidebar which closes it(but the workspace setting always remains. even after the app is turned off!) which does exactly what it says, just as in vscode.

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
*npm config set strict-ssl false
*npm install npm -g --ca=null
*npm install --save-dev electron electron-builder concurrently wait-on --prefix C:\Users\USER\Documents\code\blueprint-gui
*set NODE_TLS_REJECT_UNAUTHORIZED=0
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
