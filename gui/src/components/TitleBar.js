import React, { useState, useEffect } from 'react';
import './TitleBar.css';
import icon from '../assets/favicon.ico';

const TitleBar = () => {
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

  return (
    <div className="title-bar">
      <div className="title-bar-icon">
        <img src={icon} alt="icon" />
      </div>
      <div className="title-bar-title">{`ICDV ${version}`}</div>
    </div>
  );
};

export default TitleBar;
