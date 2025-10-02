import React, { useState, useEffect } from 'react';
import './TitleBar.css';
import icon from '../assets/favicon.ico';

const TitleBar = ({ theme }) => {
  const [version, setVersion] = useState('');

  useEffect(() => {
    const fetchVersion = async () => {
      if (window.electron) {
        const appVersion = await window.electron.getAppVersion();
        setVersion(appVersion);
      }
    };
    fetchVersion();
  }, []);

  const handleMinimize = () => window.electron.minimizeWindow();
  const handleMaximize = () => window.electron.maximizeWindow();
  const handleClose = () => window.electron.closeWindow();

  return (
    <div className="title-bar" style={{ backgroundColor: theme.palette.appBar.background, color: theme.palette.text.primary }}>
      <div className="title-bar-icon">
        <img src={icon} alt="icon" />
      </div>
      <div className="title-bar-title">{`ICDV ${version}`}</div>
      <div className="window-controls">
        <button className="window-control-button" onClick={handleMinimize}>&#xE921;</button>
        <button className="window-control-button" onClick={handleMaximize}>&#xE922;</button>
        <button className="window-control-button window-close-button" onClick={handleClose}>&#xE8BB;</button>
      </div>
    </div>
  );
};

export default TitleBar;