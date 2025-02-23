import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [
    { name: "Alessia", status: "available" },
    { name: "Antonio", status: "lead" },
    { name: "Giada", status: "absent" },
    { name: "Marco", status: "busy" },
    { name: "Luca", status: "available" },
    { name: "Sara", status: "lead" },
    { name: "Francesco", status: "absent" },
    { name: "Elena", status: "busy" },
    { name: "Davide", status: "available" },
    { name: "Martina", status: "lead" },
  ],
  currentUser: { name: "You", status: "available" },
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.currentUser.status = action.payload;
    },
  },
});

export const { setStatus } = userSlice.actions;
export default userSlice.reducer;
