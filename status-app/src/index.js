import React from "react";
import ReactDOM from "react-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { Provider } from "react-redux";
import App from "./App";
import { msalConfig } from "./authConfig";
import { store } from "./redux/store"; // Import the Redux store

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.render(
  <Provider store={store}>  {/* Wrap your app in the Redux Provider */}
    <MsalProvider instance={msalInstance}>  {/* Existing MsalProvider */}
      <App />
    </MsalProvider>
  </Provider>,
  document.getElementById("root")
);
