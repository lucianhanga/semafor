// MainAppContent.js
import React from 'react';
import UserList from './components/UserList';
import StatusSelector from './components/StatusSelector';

const MainAppContent = () => (
  <div>
    <UserList />
    <StatusSelector />
  </div>
);

export default MainAppContent;