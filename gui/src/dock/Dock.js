import React, { useState } from 'react';
import {
  Alignment,
  Button,
  Breadcrumbs,
  Classes,
  Icon,
  Menu,
  MenuItem,
  Navbar,
  Popover,
} from '@blueprintjs/core';
import { useProject } from '../contexts/ProjectContext';
import SheetView from './SheetView';
import GraphView from './GraphView';
import DocsView from './DocsView';
import './Dock.css';

const Dock = () => {
  const [renderType, setRenderType] = useState('graph');
  const { projectData } = useProject();

  const renderTypeConfig = {
    sheet: {
      icon: 'th',
      color: 'rgb(76, 175, 80)',
      text: 'Sheet',
      component: <SheetView />,
    },
    graph: {
      icon: 'data-lineage',
      color: 'rgb(255, 152, 0)',
      text: 'Graph',
      component: <GraphView />,
    },
    docs: {
      icon: 'document',
      color: 'rgb(33, 150, 243)',
      text: 'Docs',
      component: <DocsView />,
    },
  };

  const renderTypeMenu = (
    <Menu>
      <MenuItem
        icon="th"
        text="Sheet"
        onClick={() => setRenderType('sheet')}
      />
      <MenuItem
        icon="data-lineage"
        text="Graph"
        onClick={() => setRenderType('graph')}
      />
      <MenuItem
        icon="document"
        text="Docs"
        onClick={() => setRenderType('docs')}
      />
    </Menu>
  );

  const renderBreadcrumbs = () => {
    if (!projectData) {
      return (
        <Breadcrumbs
          items={[{ icon: 'ban-circle', text: 'No Project Loaded' }]}
        />
      );
    }
    // Placeholder for future hierarchy navigation
    const items = [
      { icon: 'projects', text: projectData.metadata.projectName },
    ];
    return <Breadcrumbs items={items} />;
  };

  const renderFileMenu = () => (
    <Menu>
      <MenuItem icon="folder-open" text="Open..." />
      <MenuItem icon="floppy-disk" text="Save" />
      <MenuItem icon="document" text="Save As..." />
      <MenuItem text="---" disabled />
      <MenuItem icon="import" text="Import..." />
      <MenuItem icon="export" text="Export..." />
    </Menu>
  );

  const renderContent = () => {
    if (!projectData) {
      return (
        <div className="dock-content-placeholder">
          <Icon icon="folder-open" size={60} color="#CED9E0" />
          <h3 style={{ color: '#95AAB8' }}>No Project Open</h3>
          <p style={{ color: '#B8C5D1' }}>
            Import a project from the Project Outline to begin.
          </p>
        </div>
      );
    }
    return renderTypeConfig[renderType].component;
  };

  return (
    <div className={`dock-container ${Classes.FOCUS_DISABLED}`}>
      <div className="dock-topbar">
        <Popover content={renderTypeMenu} placement="bottom-start">
          <div
            className="render-type-switcher"
            style={{ backgroundColor: renderTypeConfig[renderType].color }}
          >
            <Icon
              icon={renderTypeConfig[renderType].icon}
              size={32}
              color="white"
            />
          </div>
        </Popover>
        <div className="dock-topbar-main">
          <div className="dock-topbar-upper">{renderBreadcrumbs()}</div>
          <div className="dock-topbar-lower">
            <Navbar style={{ background: 'transparent', boxShadow: 'none' }}>
              <Navbar.Group align={Alignment.LEFT}>
                <Popover content={renderFileMenu()} placement="bottom-start">
                  <Button minimal text="File" />
                </Popover>
                <Button minimal text="Settings" />
                <Button minimal text="Help" />
              </Navbar.Group>
            </Navbar>
          </div>
        </div>
      </div>
      <div className="dock-content">{renderContent()}</div>
    </div>
  );
};

export default Dock;
