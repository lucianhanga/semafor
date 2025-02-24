import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Define the initial state
const initialState = {
  users: [],
  currentUser: { id: "", name: "", status: "available" },
  status: 'idle',
  error: null
};

// Get the API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create an async thunk to fetch users from the API
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  console.log("Fetching users from API...");
  const response = await fetch(`${API_BASE_URL}/UpdateUsers`);
  const data = await response.json();
  console.log("Users fetched from API:", data.users);
  return data.users;
});

// Create an async thunk to update the user status
export const updateUserStatus = createAsyncThunk('users/updateUserStatus', async (status, { getState }) => {
  const { currentUser } = getState().users;
  const updatedUser = { ...currentUser, status };
  console.log("Updating user status:", updatedUser);
  const response = await fetch(`${API_BASE_URL}/UpdateState`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedUser)
  });
  const data = await response.json();
  console.log("User status updated:", data);
  return data.users; // Return the updated list of users
});

// Create the user slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
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
      })
      .addCase(updateUserStatus.pending, (state) => {
        console.log("Updating user status: pending");
        state.status = 'loading';
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        console.log("Updating user status: succeeded");
        state.status = 'succeeded';
        state.users = action.payload; // Update the users list
        state.currentUser = state.users.find(user => user.id === state.currentUser.id) || state.currentUser;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        console.log("Updating user status: failed", action.error.message);
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { setCurrentUser, setStatus } = userSlice.actions;
export default userSlice.reducer;
