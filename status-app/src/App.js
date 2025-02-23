import React from "react";
import UserList from "./components/UserList";
import StatusSelector from "./components/StatusSelector";
import "./App.css";

const App = () => {
  return (
    <div className="container">
      <h1>Status Board</h1>
      <UserList />
      <StatusSelector />
    </div>
  );
};

export default App;
