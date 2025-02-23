import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [
    { name: "Alessia", status: "available" },
    { name: "Antonio", status: "lead" },
    { name: "Giada", status: "absent" },
    { name: "Marco", status: "busy" },
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
