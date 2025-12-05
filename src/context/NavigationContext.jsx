import React, { createContext, useContext } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    // Return a no-op function if not in navigation context
    return { navigate: () => console.warn('Navigation not available') };
  }
  return context;
};

export const NavigationProvider = ({ children, onNavigate }) => {
  const value = {
    navigate: onNavigate
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

