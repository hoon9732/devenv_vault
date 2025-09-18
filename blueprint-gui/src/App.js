import React from 'react';
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
  Classes,
  Menu,
  MenuItem,
  Popover,
  Position,
  Alignment
} from '@blueprintjs/core';

function App() {
  const handleOpenFile = () => {
    window.electron.openFile();
  };

  const handleSaveFile = () => {
    window.electron.saveFile();
  };

  const fileMenu = (
    <Menu>
      <MenuItem text="Open File" onClick={handleOpenFile} />
      <MenuItem text="Save File" onClick={handleSaveFile} />
    </Menu>
  );

  return (
    <div className="app-container">
      <Navbar className={Classes.DARK}>
        <NavbarGroup align={Alignment.LEFT}>
          <NavbarHeading>ICDViewer</NavbarHeading>
          <NavbarDivider />
          <Popover content={fileMenu} position={Position.BOTTOM_LEFT}>
            <Button className={Classes.MINIMAL} text="File" />
          </Popover>
          <Button className={Classes.MINIMAL} text="Edit" />
          <Button className={Classes.MINIMAL} text="View" />
          <Button className={Classes.MINIMAL} text="Help" />
        </NavbarGroup>
      </Navbar>
      <div className="app-content">
        {/* Blank screen for later features */}
      </div>
    </div>
  );
}

export default App;
