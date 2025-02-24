// Login.js
import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest, msalConfig } from "../authConfig";
import './Login.css';

const Login = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    console.log("Redirect URI:", msalConfig.auth.redirectUri); // Log the redirect URI
    instance.loginPopup(loginRequest).catch(e => {
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