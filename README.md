# 2025-10-14

My development environment is currently the greatest risk factor due to several reasons:
1. My corporate PC seems to render certain IDEs useless(Visual studio code, visual studio), so I am not sure how I can develop with .Net 8.0
2. Node.js works, but i am currently redownloading npm required library every time I reboot.
3. I am using notepad++ as code editor, and I run 'npm run electron' for testing and debug. Debugging is mostly done by AI assisted CLI
4. Currently SQLite 3.50.4 version has been installed, and seems to be safe from security restrictions


I would like you to recommend me stack and workflow to start with fast prototype development of the software I described
with the focus on node creation and editing on the fly, and easy switching of interface between 'sheet' and 'diagram' on the fly.

Give me detailed steps on what i should do based on the current codebase, referencing the github repo I showed you.

The 'gui' folder is the root of the app(others are unimportant data, and ignore gui/node_modules).

---

I would like to ask your opinion for guidance on next step of my app development, and show you the bigger picture of my plan.

Main Goal: Create a GUI for ICD(Interface Control Document) visualization, analysis and editing. The resulting software should be responsive and light(resource-wise), also robust and open for later development.

Current state: I have started developing the most basic UI elements(sidebar buttons, a file explorer sidebar, settings screen, pages)
I have started with the GUI elements. However, I still cannot decide how to develop the actual back-end of the SW, which is the core. I have found out about the concept of MBSE development principle done by software like CATIA Magic, which enables a smooth process form UML 2 system diagram to actual simulation and modeling.

Back-end Requirement: My first goal is to choose the appropriate coding language and data saving format(XML or json) for saving E-ICD(Electrical ICD) or D-ICD(Digital ICD) elements, which saves numerous sheet data for nodes and links in between(signal id, voltage, signal type etc.) So I am imagining a robust back-end for a software where you can easily create a node on a blank diagram and add unlimited amount of properties as as a sheet and unlimited levels of subproperties within. And also be able to connect the nodes with a simple drag-and-drop mouse movement, which forms a orthogonal line in between. And the line can also be edited of its numerous properties. You can either edit the diagram in diagram mode or the sheet mode, and can import or export it in numerous extensions(ex: .xls for sheet, .dwg for diagram)

Limitations: Considering that my corporate pc environment restricts access to well known IDES(Vscode), I am using notepad ++ and using Node.js as the only possible stack, back-end might also have to be developed via javascript and npm libraries.

Plan for immediate future: The ICD app should have be able to create its own 'project' on a 'dock' type single main window which works as viewer and also editor, similar to 'Photoshop' application. The current buttons on the sidebar(uncolored buttons) would make widgets in the form of extra sidebar appear to the side of the 'dock'. The file explorer sidebar is the currently only implemented widget, and it will be used for importing of files into the dock.

Other colored buttons on the sidebar('Sheet', 'Diagram', 'Docs') are simply another form of visualizing a single source of truth in the dock in differet forms(sheet should show tables with the help of blueprint js table functions, diagram should show rectangle node objects able to be connected via orthogonal lines, with nodes and line able to be added properties, docs should show simple text of the metadata of the file in the dock(extra text, spec documents etc.))

The 'project' inside the dock should be able to have its own file extension(.icd file for example) and should be savable and loadable. Currently, i am thinking of .json file be the first type of file that can be directly imported or exported from the dock.

To conclude, do not get into any specifics or code. Simply help me decide the initial steps and give me suggestions on where to start from where I stand.

---

Before we proceed, i can use some major graphic improvements on the 'Project Outline' Sidebar
1. the topbar of the 'Project Outline' Sidebar should be split into 'upper topbar' and 'lower topbar' just like the explorer topbar, with minor changes in buttons. The upper topbar should have two buttons to the left, 'Import Project' using 'import' icon from blueprint, and 'New Project' using 'add' icon from blueprint. And two buttons to the right, 'Refresh', 'Settings', and 'Close' button.
2. The lower topbar should be a search bar for searching matching contents withing the 'project outline' window.
3. The overall theme and spacing should be almost identical to the 'Explorer' sidebar(32px upper topbar, 32px lower topbar, and 64px overall)

---

Minor fixes for both the 'explorer' and the 'project outline' sidebar please.
1. Rename the 'settings' button to 'more' and use 'more' icon from blueprint instead(explorer is doing this right)
2. The buttons on the topbar of the 'project outline' should not leave blue outline around the button after clicked. I don't see such line(which looks bad) in the 'explorer' buttons so follow this case.
3. Under the 'project outline' settings(now 'more') dropdown, add 'Show Icons', 'Show on Start'(with also actual functions). Also rename the 'explorer' counterparts from 'Workspace Icons' to 'Show Icons', and 'Default Workspace' to also 'Show on Start'. And lastly, add a 3rd category for 'explorer' and 'project outline' sidebar called 'Show Animation' which turns on or off the expanding/shrinking animation of the sidebar itself. Currently, the 'explorer' has animation by default, and 'Project Outline' does not. So make animation toggleable on both.

---

Now that the loading fuctionality has been achieved, the next logical step would be the editing and saving function. But we might need a restructuring of the app before that.

1. The current 'page' system is not compatible with the singular 'dock' system showing different renderings of a single source of truth. Remove current placeholder pages and related placeholder data except for global 'settings' page and 'profiles' page. 'Settings' and 'Profiles' will be later implemented in the form of a separate window within the app(like the photoshop preferences settings), but that would be a subject for later. simply make them not appear in the main screen when the button is clicked.
2. The new 'dock' will occupy the remaining space as the representation of single source of truth. It will have a topbar of 64px height to match other sidebar height. At the leftmost part of the topbar, a 64x64 px square region should show a color-coded(green, crimson, blue) icon of the type of rendering the currently loaded project is showing(sheet, graph(renamed 'diagram'), or docs, showing sheet by default). Clicking this icon will create a dropdown menu for changing its type. This method will replace the sidebar icons(sidebar icons for sheet, graph and docs would be removed).
To the right of the 'Render Type' squareicon would be the remaining topbar, which is separated into 32px height upper topbar and lower topbar. The upper topbar should show the hierarchy of the object currently opend on the dock screen. So, by default there should be a 'project' icon from blueprintjs in the left, and then 'root_project_name'. If there is a node 'Battery-A' in it, and if I double-clicked it, the screen would show its subordinates and the topbar should show 'root_project_name'>'battery'. I heard that blueprintjs has a library for this kind of representation.
And the bottom topbar would have conventional dropdown toolbar menus 'File', 'Settings', 'Help' each with categories like 'Open', 'Save', 'Save As', 'Import', 'Export' under 'File' etc.(settings and help are placeholders for now)
3. Use blueprintjs built-in libraries as much as possible to implement this visual feature. And if possible, try to show the sheet, graph, docs version of the loaded single file according to the 'Render Type'

---

I can see that currently, the loaded test.icd project is not showing anything.
Can you first implement the sheet view using the table function of the blueprintjs to enable full viewing and editing of the data as in excel.

---

I would like to suggest a major fix in the functionality of the outline sidebar
1. The outline sidebar is simply a widget for showing projects currently loaded on the app. It should work as a list of projects ready to be opened. Thus, the import project should enable multiple imports and the largest unit in the 'Project Outline' list should be individual projects(individual .json, .icd files), not the nodes and edges. I want the same arrow expansion/shrinking dropdown layout as in the explorer sidebar, so that each project can be expanded to see nodes and edges inside it, and also subnodes inside each node if there is. And most importantly, the project loaded on the outline should not appear on the dock unless the outline project is double-clicked or dragged and drop onto the dock.(ALso revise the test for blank dock accordingly)
2. The primary way for loading a project would be through the bottom topbar 'Files'-'Open' Button. Only a single project can be loaded by this method.
3. Create 'New' Button over the 'Open' Button to create a blank graph. and also add basic node, edge editing tools if they are present in react flow. Also enable save, save as function for new files or saving existing json/icd files into icd. Use export for saving as .json.

# 2025-09-30

Main Goal: Create a GUI for ICD(Interface Control Document) visualization, analysis and editing.

Major Requirement: The resulting software should be responsive and light(resource-wise), also robust and open for later development.

Current state: I have started developing the most basic UI elements based on react, electron, blueprint.js in a npm-based environment.
I have concluded that the react based GUI is light and modern, and might be visually simple. However, I still cannot decide how to develop the actual back-end of the SW, which is the core. I have found out about the concept of MBSE development principle done by software like CATIA Magic, which enables a smooth process form UML 2 system diagram to actual simulation and modeling.

Back-end Requirement: My first goal is to choose the appropriate coding language and data saving format(XML or json) for saving E-ICD(Electrical ICD) or D-ICD(Digital ICD) elements, which saves numerous sheet data for nodes and links in between(signal id, voltage, signal type etc.) So I am imagining a robust back-end for a software where you can easily create a node on a blank diagram and add unlimited amount of properties as as a sheet and unlimited levels of subproperties within. And also be able to connect the nodes with a simple drag-and-drop mouse movement, which forms a orthogonal line in between. And the line can also be edited of its numerous properties. You can either edit the diagram in diagram mode or the sheet mode, and can import or export it in numerous extensions(ex: .xls for sheet, .dwg for diagram)

My superior recommends C# for back-end development. Would it be a good option? Or would you suggest otherwise?
The frontend is developed on electron, so I am not sure how to connect the backend with it? 

Here is the repository address for you to have insight on the current GUI development:
github.com/hoon9732/devenv_vault

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
