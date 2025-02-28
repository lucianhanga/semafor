import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Define the initial state
const initialState = {
  users: [],
  currentUser: { id: "", name: "", status: "available" },
  status: 'idle',
  error: null,
  usersHash: null // Add a field to store the hash of the users list
};

// Get the API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create a hash function for the users list
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const hashUsers = (users) => {
  return hashCode(JSON.stringify(users));
};

// Create an async thunk to fetch users from the API
export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { getState, rejectWithValue }) => {
  console.log("Fetching users from API...");
  try {
    const response = await fetch(`${API_BASE_URL}/UpdateUsers`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    console.log("Users fetched from API:", data.users);

    const currentUsersHash = getState().users.usersHash;
    const newUsersHash = hashUsers(data.users);
    console.log("Current users hash:", currentUsersHash);
    console.log("New users hash:", newUsersHash);

    if (currentUsersHash !== newUsersHash) {
      return { users: data.users, usersHash: newUsersHash }; // Return the updated list of users and the new hash
    } else {
      return { users: getState().users.users, usersHash: currentUsersHash }; // Return the current list of users and the current hash if no changes
    }
  } catch (error) {
    return rejectWithValue(error.message);
  }
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
        state.users = action.payload.users;
        state.usersHash = action.payload.usersHash;
        // Update the current user's status if they exist in the fetched list
        const updatedCurrentUser = state.users.find(user => user.id === state.currentUser.id);
        if (updatedCurrentUser) {
          state.currentUser.status = updatedCurrentUser.status;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        console.log("Fetching users: failed", action.payload);
        state.status = 'failed';
        state.error = action.payload;
        state.users = []; // Clear the user list on error
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
