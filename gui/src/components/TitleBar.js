import React from 'react';
import './TitleBar.css';
import icon from '../assets/favicon.ico';

const TitleBar = () => {
  return (
    <div className="title-bar">
      <div className="title-bar-icon">
        <img src={icon} alt="icon" />
      </div>
      <div className="title-bar-title">ICDV</div>
    </div>
  );
};

export default TitleBar;
