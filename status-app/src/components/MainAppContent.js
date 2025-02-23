// MainAppContent.js
import React from 'react';
import UserList from './UserList';
import StatusSelector from './StatusSelector';

const MainAppContent = () => (
  <div>
    <UserList />
    <StatusSelector />
  </div>
);

export default MainAppContent;