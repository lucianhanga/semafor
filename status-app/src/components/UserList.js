import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { fetchUsers } from "../redux/userSlice";
import UpdateButton from "./UpdateButton";
import StatusBar from "./StatusBar";
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
    }, 10000); // 10000 milliseconds = 10 seconds

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [userStatus, dispatch]);

  console.log("User status:", userStatus);
  console.log("Users:", users);

  return (
    <div className="user-list">
      <UpdateButton />
      <StatusBar />
      {userStatus !== 'failed' && users.map((user) => (
        <div key={user.id} className="user" data-tooltip-id={`tooltip-${user.id}`} data-tooltip-content={user.text}>
          <span className="name">{user.name}</span>
          <span className={`status ${user.status}`}></span>
          <Tooltip id={`tooltip-${user.id}`} />
        </div>
      ))}
    </div>
  );
};

export default UserList;
