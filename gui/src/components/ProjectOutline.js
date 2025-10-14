import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Classes,
  InputGroup,
  Tooltip,
  Icon,
  Popover,
  Menu,
  MenuItem,
} from '@blueprintjs/core';
import { useProject } from '../contexts/ProjectContext';
import './ProjectOutline.css';

const drawerWidth = 280;

const ProjectOutline = ({ open, onClose }) => {
  const { projectData, loadProject } = useProject();
  const [settings, setSettings] = useState({
    showIcons: true,
    showOnStart: false,
    showAnimation: true,
  });

  const handleSettingChange = (settingName) => {
    setSettings((prev) => ({ ...prev, [settingName]: !prev[settingName] }));
    // NOTE: Logic to save these settings would be added here later
  };

  const handleImportProject = async () => {
    if (window.electron) {
      const content = await window.electron.openFileDialog();
      if (content) {
        try {
          const projectJson = JSON.parse(content);
          loadProject(projectJson);
        } catch (error) {
          console.error('Failed to parse project file:', error);
          // Optionally, show an error message to the user
        }
      }
    } else {
      console.error('Electron context not available for file dialog.');
    }
  };

  const settingsMenu = (
    <Menu>
      <MenuItem
        icon={settings.showIcons ? 'tick' : 'blank'}
        text="Show Icons"
        onClick={() => handleSettingChange('showIcons')}
      />
      <MenuItem
        icon={settings.showOnStart ? 'tick' : 'blank'}
        text="Show on Start"
        onClick={() => handleSettingChange('showOnStart')}
      />
      <MenuItem
        icon={settings.showAnimation ? 'tick' : 'blank'}
        text="Show Animation"
        onClick={() => handleSettingChange('showAnimation')}
      />
    </Menu>
  );

  const renderContent = () => {
    if (!projectData) {
      return (
        <div className="project-outline-content empty">
          <p>No project loaded.</p>
          <p>
            Click the <Icon icon="import" size={12} /> button to import a
            project.
          </p>
        </div>
      );
    }

    const { nodes, edges } = projectData;
    return (
      <div className="project-outline-content">
        <div className="outline-section">
          <h5>Nodes ({nodes.length})</h5>
          <ul>
            {nodes.map((node) => (
              <li key={node.id} className="outline-item">
                {settings.showIcons && (
                  <Icon
                    icon="database"
                    size={14}
                    style={{ marginRight: '8px' }}
                  />
                )}
                {node.data.label || node.id}
              </li>
            ))}
          </ul>
        </div>
        <div className="outline-section">
          <h5>Edges ({edges.length})</h5>
          <ul>
            {edges.map((edge) => (
              <li key={edge.id} className="outline-item">
                {settings.showIcons && (
                  <Icon
                    icon="flow-linear"
                    size={14}
                    style={{ marginRight: '8px' }}
                  />
                )}
                {edge.label || edge.id}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`project-outline-container ${Classes.FOCUS_DISABLED}`}
      style={{
        width: open ? drawerWidth : 0,
        transition: !settings.showAnimation
          ? 'none'
          : 'width 0.3s ease-in-out',
      }}
    >
      <div className="outline-inner-container" style={{ width: drawerWidth }}>
        <div className="outline-topbar">
          <div className="outline-topbar-upper">
            <div className="outline-topbar-left">
              <Tooltip
                content="Import Project"
                placement="top"
                usePortal={false}
              >
                <Button minimal icon="import" onClick={handleImportProject} />
              </Tooltip>
              <Tooltip content="New Project" placement="top" usePortal={false}>
                <Button minimal icon="add" />
              </Tooltip>
            </div>
            <div className="outline-topbar-right">
              <Tooltip content="Refresh" placement="top" usePortal={false}>
                <Button minimal icon="refresh" />
              </Tooltip>
              <Popover
                content={settingsMenu}
                placement="bottom-end"
                usePortal={false}
              >
                <Tooltip content="More" placement="top" usePortal={false}>
                  <Button minimal icon="more" />
                </Tooltip>
              </Popover>
              <Tooltip content="Close" placement="top" usePortal={false}>
                <Button minimal icon="cross" onClick={onClose} />
              </Tooltip>
            </div>
          </div>
          <div className="outline-topbar-lower">
            <InputGroup
              leftIcon="search"
              placeholder="Search outline..."
              round
              small
              disabled={!projectData}
            />
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

ProjectOutline.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProjectOutline;
