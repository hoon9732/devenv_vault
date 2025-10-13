import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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

  return (
    <div
      className="title-bar draggable"
      style={{
        backgroundColor: theme.palette.appBar.background,
        color: theme.palette.text.primary,
      }}
    >
      <div className="title-bar-icon">
        <img src={icon} alt="icon" />
      </div>
      <div className="title-bar-title">{`ICDV ${version}`}</div>
    </div>
  );
};

TitleBar.propTypes = {
  theme: PropTypes.shape({
    palette: PropTypes.shape({
      appBar: PropTypes.shape({
        background: PropTypes.string,
      }),
      text: PropTypes.shape({
        primary: PropTypes.string,
      }),
    }),
  }).isRequired,
};

export default TitleBar;
