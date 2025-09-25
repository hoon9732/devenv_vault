import React, { createContext, useState, useContext } from 'react';

const UIScaleContext = createContext();

export const UIScaleProvider = ({ children }) => {
  const [scale, setScale] = useState(100);

  return (
    <UIScaleContext.Provider value={{ scale, setScale }}>
      <div style={{ fontSize: `${scale}%` }}>
        {children}
      </div>
    </UIScaleContext.Provider>
  );
};

export const useUIScale = () => useContext(UIScaleContext);
