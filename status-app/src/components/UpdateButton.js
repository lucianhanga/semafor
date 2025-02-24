import React from "react";
import { useDispatch } from "react-redux";
import { fetchUsers } from "../redux/userSlice";
import "./UpdateButton.css";

const UpdateButton = () => {
  const dispatch = useDispatch();

  const handleUpdateNow = () => {
    dispatch(fetchUsers());
  };

  return (
    <button className="update-now-button" onClick={handleUpdateNow}>
      &#x21bb; {/* Unicode character for a refresh symbol */}
    </button>
  );
};

export default UpdateButton;