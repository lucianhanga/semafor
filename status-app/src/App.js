import React from "react";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import MainAppContent from "./components/MainAppContent";
import Taskbar from "./components/Taskbar"; // Import Taskbar
import Login from "./components/Login"; // Import Login
import { loginRequest } from './authConfig'; // Import loginRequest
import "./App.css";

const App = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  return (
    <div className="container">
      <div className="draggable"></div> {/* Add draggable area */}
      <AuthenticatedTemplate>
        <div>
          <h2>Welcome, {account && account.name}!</h2>
          <MainAppContent />
        </div>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
      <Taskbar /> {/* Add Taskbar */}
    </div>
  );
};

export default App;
