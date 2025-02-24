import React from "react";
import { useSelector } from "react-redux";
import "./StatusBar.css";

const StatusBar = () => {
  const userStatus = useSelector((state) => state.users.status);
  const error = useSelector((state) => state.users.error);

  return (
    <div className="status-bar">
      {userStatus === 'loading' && <div>Loading...</div>}
      {userStatus === 'succeeded' && <div>Update succeeded</div>}
      {userStatus === 'failed' && <div>Error: {error}</div>}
    </div>
  );
};

export default StatusBar;