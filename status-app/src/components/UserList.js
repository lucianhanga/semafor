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
    // Fetch users initially
    if (userStatus === 'idle') {
      dispatch(fetchUsers());
    }

    // Set up an interval to fetch users every minute
    const intervalId = setInterval(() => {
      dispatch(fetchUsers());
    }, 60000); // 60000 milliseconds = 1 minute

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
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
