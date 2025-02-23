import React from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import './Taskbar.css';

const Taskbar = () => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="taskbar">
      {isAuthenticated ? <p>You are logged in!</p> : <p>You are not logged in.</p>}
    </div>
  );
};

export default Taskbar;
