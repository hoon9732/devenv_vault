import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import './Page.css';

const Page = ({ icon, title, children }) => {
  return (
    <div className="page-container">
      <div className="page-topbar">
        <div className="page-icon-container">
          <Icon icon={icon} size={32} color="#5c7080" />
        </div>
        <div className="page-title-container">
          <h1>{title}</h1>
        </div>
      </div>
      <div className="page-content">{children}</div>
    </div>
  );
};

Page.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Page;
