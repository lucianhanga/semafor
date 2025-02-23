// Login.js
import React from 'react';
import { useMsal } from '@azure/msal-react';

const Login = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup().catch(e => {
      console.error(e);
    });
  };

  return (
    <div>
      <h2>Please log in to continue</h2>
      <button onClick={handleLogin}>Login with Azure</button>
    </div>
  );
};

export default Login;