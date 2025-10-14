import React, { useState } from 'react';
import PropTypes from 'prop-types';
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

const Dock = ({ uiScale }) => {
  const [renderType, setRenderType] = useState('graph');
  const {
    activeProject,
    createNewActiveProject,
    loadProjectAsActive,
    exportActiveProjectToJson,
  } = useProject();
  const [currentFilePath, setCurrentFilePath] = useState(null);

  const handleNewProject = () => {
    createNewActiveProject();
    setCurrentFilePath(null); // A new project doesn't have a path yet
  };

  const handleOpenProject = async () => {
    if (window.electron) {
      const result = await window.electron.openFileDialog();
      if (result && result.content) {
        try {
          const projectJson = JSON.parse(result.content);
          loadProjectAsActive(projectJson);
          setCurrentFilePath(result.filePath);
        } catch (error) {
          console.error('Failed to parse project file:', error);
        }
      }
    }
  };

  const handleSave = async () => {
    if (!activeProject || !currentFilePath) return;
    const content = exportActiveProjectToJson();
    if (window.electron) {
      // This is a simplified save. A real app would use a main-process handler
      // to write the file without a dialog.
      try {
        await window.electron.saveFileContent(currentFilePath, content);
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handleSaveAs = async () => {
    if (!activeProject) return;
    const content = exportActiveProjectToJson();
    if (window.electron) {
      const result = await window.electron.saveFileDialog({
        content,
        fileType: 'icd',
      });
      if (result.success) {
        setCurrentFilePath(result.filePath);
      }
    }
  };

  const handleExport = async () => {
    if (!activeProject) return;
    const content = exportActiveProjectToJson();
    if (window.electron) {
      await window.electron.saveFileDialog({ content, fileType: 'json' });
    }
  };

  const renderTypeConfig = {
    sheet: {
      icon: 'th',
      color: 'rgb(76, 175, 80)',
      text: 'Sheet',
      component: <SheetView uiScale={uiScale} />,
    },
    graph: {
      icon: 'data-lineage',
      color: 'rgb(255, 152, 0)',
      text: 'Graph',
      component: <GraphView uiScale={uiScale} />,
    },
    docs: {
      icon: 'document',
      color: 'rgb(33, 150, 243)',
      text: 'Docs',
      component: <DocsView uiScale={uiScale} />,
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
    if (!activeProject) {
      return (
        <Breadcrumbs
          items={[{ icon: 'ban-circle', text: 'No Project Loaded' }]}
        />
      );
    }
    // Placeholder for future hierarchy navigation
    const items = [
      { icon: 'projects', text: activeProject.metadata.projectName },
    ];
    return <Breadcrumbs items={items} />;
  };

  const renderFileMenu = () => (
    <Menu>
      <MenuItem icon="document" text="New" onClick={handleNewProject} />
      <MenuItem icon="folder-open" text="Open..." onClick={handleOpenProject} />
      <MenuItem icon="floppy-disk" text="Save" onClick={handleSave} disabled={!currentFilePath} />
      <MenuItem
        icon="floppy-disk"
        text="Save As..."
        onClick={handleSaveAs}
        disabled={!activeProject}
      />
      <MenuItem text="---" disabled />
      <MenuItem
        icon="export"
        text="Export as JSON..."
        onClick={handleExport}
        disabled={!activeProject}
      />
    </Menu>
  );

  const renderContent = () => {
    if (!activeProject) {
      return (
        <div className="dock-content-placeholder">
          <Icon icon="folder-open" size={60} color="#CED9E0" />
          <h3 style={{ color: '#95AAB8' }}>No Project Open</h3>
          <p style={{ color: '#B8C5D1' }}>
            Select File {'>'} New or File {'>'} Open to begin.
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
            <div className="dock-toolbar">
              <Popover content={renderFileMenu()} placement="bottom-start">
                <Button minimal text="File" />
              </Popover>
              <Button minimal text="Settings" />
              <Button minimal text="Help" />
            </div>
          </div>
        </div>
      </div>
      <div className="dock-content">{renderContent()}</div>
    </div>
  );
};

Dock.propTypes = {
  uiScale: PropTypes.number.isRequired,
};

export default Dock;
