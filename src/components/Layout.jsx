import React from 'react';
import { useTheme } from '../context/ThemeContext';
import LayoutTailwind from './LayoutTailwind';
import LayoutBootstrap from './Layout.bootstrap';

/**
 * Layout Wrapper Component
 * Conditionally renders Tailwind or Bootstrap layout based on active theme
 */
const Layout = (props) => {
  const { isBootstrap } = useTheme();

  // Render Bootstrap layout if Bootstrap theme is active
  if (isBootstrap) {
    return <LayoutBootstrap {...props} />;
  }

  // Otherwise render Tailwind layout (default)
  return <LayoutTailwind {...props} />;
};

export default Layout;
