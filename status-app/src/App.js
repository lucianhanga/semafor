import React, { useEffect, useState } from "react";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useDispatch } from "react-redux";
import MainAppContent from "./components/MainAppContent";
import Taskbar from "./components/Taskbar"; // Import Taskbar
import Login from "./components/Login"; // Import Login
import { loginRequest } from './authConfig'; // Import loginRequest
import { setCurrentUser } from "./redux/userSlice"; // Import setCurrentUser action
import "./App.css";

const App = () => {
  const { instance, accounts } = useMsal();
  const dispatch = useDispatch();
  const account = accounts[0];
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkUserGroup = async () => {
      if (account) {
        const currentUser = {
          id: account.localAccountId,
          name: account.name,
          status: "available"
        };
        dispatch(setCurrentUser(currentUser));

        try {
          console.log("Attempting to acquire token silently...");
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account
          });
          console.log("Token acquired:", tokenResponse.accessToken);

          console.log("Fetching user group memberships...");
          const response = await fetch(`https://graph.microsoft.com/v1.0/me/memberOf`, {
            headers: {
              Authorization: `Bearer ${tokenResponse.accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch user group memberships: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("User group memberships fetched:", data);

          // Check for group ID instead of display name
          const isMember = data.value.some(group => group.id === "7d84630d-3a91-4e63-9cca-2b8da40b5d1f");
          console.log("Is user a member of 'Semafor App Users'?", isMember);

          setIsAuthorized(isMember);
        } catch (error) {
          console.error("Error checking user group:", error);
        }
      }
    };

    checkUserGroup();
  }, [account, dispatch, instance]);

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error(e);
    });
  };

  return (
    <div className="container">
      <div className="draggable"></div> {/* Add draggable area */}
      <AuthenticatedTemplate>
        {isAuthorized ? (
          <div>
            <h2>Welcome, {account && account.name}!</h2>
            <button onClick={handleLogout}>Logout</button> {/* Add Logout button */}
            <MainAppContent />
          </div>
        ) : (
          <div>
            <h2>Not Authorized</h2>
            <p>You do not have access to this application.</p>
            <button onClick={handleLogout}>Logout</button> {/* Add Logout button */}
          </div>
        )}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
      <Taskbar /> {/* Add Taskbar */}
    </div>
  );
};

export default App;
