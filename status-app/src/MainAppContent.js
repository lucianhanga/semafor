// MainAppContent.js
import React from 'react';
import UserList from './components/UserList';
import StatusSelector from './components/StatusSelector';

const MainAppContent = () => (
  <div>
    <h1>Status Board</h1>
    <UserList />
    <StatusSelector />
    <p>You are logged in!</p>
  </div>
);

export default MainAppContent;