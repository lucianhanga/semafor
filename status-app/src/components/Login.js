// Login.js
import React from 'react';
import { useMsal } from '@azure/msal-react';
import './Login.css';

const Login = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup().catch(e => {
      console.error(e);
    });
  };

  return (
    <div className="login-container">
      <h2>Please log in to continue</h2>
      <button className="login-button" onClick={handleLogin}>Login with Azure</button>
    </div>
  );
};

export default Login;