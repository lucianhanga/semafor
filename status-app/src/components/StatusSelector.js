import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setStatus } from "../redux/userSlice";
import "./StatusSelector.css";

const StatusSelector = () => {
  const dispatch = useDispatch();
  const currentStatus = useSelector((state) => state.users.currentUser.status);

  return (
    <div className="status-selector">
      <h2>Set Your Status</h2>
      <div>
        <button className={`status-button absent ${currentStatus === "absent" ? "active" : ""}`} onClick={() => dispatch(setStatus("absent"))}>
          Assente
        </button>
        <button className={`status-button lead ${currentStatus === "lead" ? "active" : ""}`} onClick={() => dispatch(setStatus("lead"))}>
          Con Lead
        </button>
        <button className={`status-button busy ${currentStatus === "busy" ? "active" : ""}`} onClick={() => dispatch(setStatus("busy"))}>
          Impegnato
        </button>
        <button className={`status-button available ${currentStatus === "available" ? "active" : ""}`} onClick={() => dispatch(setStatus("available"))}>
          Disponibile
        </button>
      </div>
    </div>
  );
};

export default StatusSelector;
