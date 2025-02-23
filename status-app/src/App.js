import React from "react";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import MainAppContent from "./MainAppContent";
import Taskbar from "./Taskbar"; // Import Taskbar
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
      <div className="draggable"></div> {/* Add draggable area */}
      <AuthenticatedTemplate>
        <MainAppContent />
        <Taskbar /> {/* Add Taskbar */}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <p>You are not logged in. Please log in.</p>
        <button onClick={handleLogin}>Login</button>
      </UnauthenticatedTemplate>
    </div>
  );
};

export default App;
