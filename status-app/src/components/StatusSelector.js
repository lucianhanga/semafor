import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";
import { setStatus, updateUserStatus } from "../redux/userSlice";
import "./StatusSelector.css";

const StatusSelector = () => {
  const dispatch = useDispatch();
  const currentStatus = useSelector((state) => state.users.currentUser.status);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [text, setText] = useState("");

  const statusColors = {
    absent: "#ff4d4d",
    lead: "#ffff00",
    busy: "#cccccc",
    available: "#4caf50",
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    dispatch(setStatus(selectedStatus));
    dispatch(updateUserStatus({ status: selectedStatus, text }));
    setIsModalOpen(false);
    setText("");
  };

  return (
    <div className="status-selector">
      <h2>Set Your Status</h2>
      <div>
        <button className={`status-button absent ${currentStatus === "absent" ? "active" : ""}`} onClick={() => handleStatusChange("absent")}>
          Assente
        </button>
        <button className={`status-button lead ${currentStatus === "lead" ? "active" : ""}`} onClick={() => handleStatusChange("lead")}>
          Con Lead
        </button>
        <button className={`status-button available ${currentStatus === "available" ? "active" : ""}`} onClick={() => handleStatusChange("available")}>
          Disponibile
        </button>
      </div>
      <div className="status-display" style={{ backgroundColor: statusColors[currentStatus], color: "#000000" }}>
        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} contentLabel="Enter Status Text">
        <h2>Enter Text for Status</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
      </Modal>
    </div>
  );
};

export default StatusSelector;
