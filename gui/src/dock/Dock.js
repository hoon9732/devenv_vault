import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Breadcrumbs,
  Classes,
  Icon,
} from '@blueprintjs/core';
import ScaledMenu from '../components/ScaledMenu';
import ScaledMenuItem from '../components/ScaledMenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useProject } from '../contexts/ProjectContext';
import SheetView from './SheetView';
import GraphView from './GraphView';
import DocsView from './DocsView';
import SettingsScreen from '../pages/SettingsScreen';
import ProfileScreen from '../pages/ProfileScreen';
import './Dock.css';

const Dock = ({
  uiScale,
  themeMode,
  setThemeMode,
  isHardwareAccelerationEnabled,
  setIsHardwareAccelerationEnabled,
  setUiScale,
}) => {
  const {
    activeProject,
    createNewActiveProject,
    loadProjectAsActive,
    exportActiveProjectToJson,
    activeView,
    setActiveView,
  } = useProject();
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [renderTypeMenuAnchorEl, setRenderTypeMenuAnchorEl] = useState(null);
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState(null);

  const handleRenderTypeMenuClick = (event) => {
    setRenderTypeMenuAnchorEl(event.currentTarget);
  };

  const handleRenderTypeMenuClose = () => {
    setRenderTypeMenuAnchorEl(null);
  };

  const handleFileMenuClick = (event) => {
    setFileMenuAnchorEl(event.currentTarget);
  };

  const handleFileMenuClose = () => {
    setFileMenuAnchorEl(null);
  };

  const isPageView = ['settings', 'profile'].includes(activeView);

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
      color: '#4CAF50',
      text: 'Sheet',
      component: <SheetView uiScale={uiScale} />,
    },
    graph: {
      icon: 'data-lineage',
      color: '#FF9800',
      text: 'Graph',
      component: <GraphView uiScale={uiScale} />,
    },
    docs: {
      icon: 'document',
      color: '#2196F3',
      text: 'Docs',
      component: <DocsView uiScale={uiScale} />,
    },
    settings: {
      icon: 'cog',
      color: '#999999',
      text: 'Settings',
      component: (
        <SettingsScreen
          uiScale={uiScale}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          isHardwareAccelerationEnabled={isHardwareAccelerationEnabled}
          setIsHardwareAccelerationEnabled={setIsHardwareAccelerationEnabled}
          setUiScale={setUiScale}
        />
      ),
    },
    profile: {
      icon: 'user',
      color: '#999999',
      text: 'Profile',
      component: <ProfileScreen uiScale={uiScale} />,
    },
  };



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



  const renderContent = () => {
    if (!activeProject && !['settings', 'profile'].includes(activeView)) {
      return (
        <div className="dock-content-placeholder">
          <Icon icon="folder-open" size={60} color="var(--text-secondary)" />
          <h3 style={{ color: 'var(--text-secondary)' }}>No Project Open</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Select File {'>'} New or File {'>'} Open to begin.
          </p>
        </div>
      );
    }
    return renderTypeConfig[activeView].component;
  };

  return (
    <div className={`dock-container ${Classes.FOCUS_DISABLED}`}>
      <div className="dock-topbar">
        <div
          className={`render-type-switcher ${isPageView ? 'disabled' : ''}`}
          style={{ backgroundColor: renderTypeConfig[activeView].color }}
          onClick={!isPageView ? handleRenderTypeMenuClick : undefined}
        >
          <Icon
            icon={renderTypeConfig[activeView].icon}
            size={32}
            color="white"
          />
        </div>
        <ScaledMenu
          anchorEl={renderTypeMenuAnchorEl}
          open={Boolean(renderTypeMenuAnchorEl)}
          onClose={handleRenderTypeMenuClose}
          uiScale={uiScale}
          dense
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              borderRadius: 0,
            },
          }}
        >
          <ScaledMenuItem onClick={() => { setActiveView('sheet'); handleRenderTypeMenuClose(); }}>
            <ListItemIcon><Icon icon="th" /></ListItemIcon>Sheet
          </ScaledMenuItem>
          <ScaledMenuItem onClick={() => { setActiveView('graph'); handleRenderTypeMenuClose(); }}>
            <ListItemIcon><Icon icon="data-lineage" /></ListItemIcon>Graph
          </ScaledMenuItem>
          <ScaledMenuItem onClick={() => { setActiveView('docs'); handleRenderTypeMenuClose(); }}>
            <ListItemIcon><Icon icon="document" /></ListItemIcon>Docs
          </ScaledMenuItem>
        </ScaledMenu>
        <div
          className={`dock-topbar-main ${
            isPageView ? 'page-view-header' : ''
          }`}
        >
          <div className="dock-topbar-upper">
            {isPageView ? (
              <span style={{ fontSize: '18px', fontWeight: 600 }}>
                {renderTypeConfig[activeView].text}
              </span>
            ) : (
              renderBreadcrumbs()
            )}
          </div>
          {!isPageView && (
            <div className="dock-topbar-lower">
              <div className="dock-toolbar">
                <Button minimal text="File" onClick={handleFileMenuClick} />
                <ScaledMenu
                  anchorEl={fileMenuAnchorEl}
                  open={Boolean(fileMenuAnchorEl)}
                  onClose={handleFileMenuClose}
                  uiScale={uiScale}
                  dense
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  PaperProps={{
                    sx: {
                      borderRadius: 0,
                    },
                  }}
                >
                  <ScaledMenuItem onClick={() => { handleNewProject(); handleFileMenuClose(); }}>
                    <ListItemIcon><Icon icon="document" /></ListItemIcon>New
                  </ScaledMenuItem>
                  <ScaledMenuItem onClick={() => { handleOpenProject(); handleFileMenuClose(); }}>
                    <ListItemIcon><Icon icon="folder-open" /></ListItemIcon>Open...
                  </ScaledMenuItem>
                  <ScaledMenuItem onClick={() => { handleSave(); handleFileMenuClose(); }} disabled={!currentFilePath}>
                    <ListItemIcon><Icon icon="floppy-disk" /></ListItemIcon>Save
                  </ScaledMenuItem>
                  <ScaledMenuItem onClick={() => { handleSaveAs(); handleFileMenuClose(); }} disabled={!activeProject}>
                    <ListItemIcon><Icon icon="floppy-disk" /></ListItemIcon>Save As...
                  </ScaledMenuItem>
                  <ScaledMenuItem onClick={() => { handleExport(); handleFileMenuClose(); }} disabled={!activeProject}>
                    <ListItemIcon><Icon icon="export" /></ListItemIcon>Export as JSON...
                  </ScaledMenuItem>
                </ScaledMenu>
                <Button minimal text="Settings" />
                <Button minimal text="Help" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="dock-content">{renderContent()}</div>
    </div>
  );
};

Dock.propTypes = {
  uiScale: PropTypes.number.isRequired,
  themeMode: PropTypes.string.isRequired,
  setThemeMode: PropTypes.func.isRequired,
  isHardwareAccelerationEnabled: PropTypes.bool.isRequired,
  setIsHardwareAccelerationEnabled: PropTypes.func.isRequired,
  setUiScale: PropTypes.func.isRequired,
};

export default Dock;