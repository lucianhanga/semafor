import React from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import './Taskbar.css';

const Taskbar = () => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error(e);
    });
  };

  return (
    <div className="taskbar">
      {isAuthenticated ? (
        <>
          <p>You are logged in!</p>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
};

export default Taskbar;
