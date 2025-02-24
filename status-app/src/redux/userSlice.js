import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Define the initial state
const initialState = {
  users: [],
  currentUser: { name: "You", status: "available" },
  status: 'idle',
  error: null
};

// Create an async thunk to fetch users from the API
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  console.log("Fetching users from API...");
  const response = await fetch('http://localhost:7071/api/UpdateUsers');
  const data = await response.json();
  console.log("Users fetched from API:", data.users);
  return data.users;
});

// Create the user slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.currentUser.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        console.log("Fetching users: pending");
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        console.log("Fetching users: succeeded");
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        console.log("Fetching users: failed", action.error.message);
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { setStatus } = userSlice.actions;
export default userSlice.reducer;
