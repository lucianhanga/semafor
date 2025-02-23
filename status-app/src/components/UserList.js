import React from "react";
import { useSelector } from "react-redux";
import "./UserList.css";

const UserList = () => {
  const users = useSelector((state) => state.users.users);

  return (
    <div className="user-list">
      {users.map((user, index) => (
        <div key={index} className="user">
          <span className="name">{user.name}</span>
          <span className={`status ${user.status}`}></span>
        </div>
      ))}
    </div>
  );
};

export default UserList;
