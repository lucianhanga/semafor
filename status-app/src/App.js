import React from "react";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import MainAppContent from "./MainAppContent";
import { loginRequest } from './authConfig'; // Import loginRequest
import "./App.css";

const App = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  return (
    <div className="container">
      <AuthenticatedTemplate>
        <MainAppContent />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <h1>Status Board</h1>
        <p>You are not logged in. Please log in.</p>
        <button onClick={handleLogin}>Login</button>
      </UnauthenticatedTemplate>
    </div>
  );
};

export default App;
