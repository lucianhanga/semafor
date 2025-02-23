import React from "react";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import MainAppContent from "./components/MainAppContent";
import Taskbar from "./components/Taskbar"; // Import Taskbar
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
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <p>You are not logged in. Please log in.</p>
        <button onClick={handleLogin}>Login</button>
      </UnauthenticatedTemplate>
      <Taskbar /> {/* Add Taskbar */}
    </div>
  );
};

export default App;
