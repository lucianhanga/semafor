import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../redux/userSlice";
import "./UserList.css";

const UserList = () => {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.users);
  const userStatus = useSelector((state) => state.users.status);
  const error = useSelector((state) => state.users.error);

  useEffect(() => {
    if (userStatus === 'idle') {
      dispatch(fetchUsers());
    }
  }, [userStatus, dispatch]);

  if (userStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (userStatus === 'failed') {
    return <div>Error: {error}</div>;
  }

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
