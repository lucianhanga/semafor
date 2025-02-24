const { app } = require('@azure/functions');
const { ConfidentialClientApplication } = require("@azure/msal-node");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);
const usersFilePath = path.join(__dirname, 'users.json');
const lockFilePath = path.join(__dirname, 'users.lock');

const acquireLock = async (filePath, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.writeFile(filePath, 'locked', { flag: 'wx' });
      return;
    } catch (err) {
      if (err.code === 'EEXIST') {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error('Failed to acquire lock');
        }
      } else {
        throw err;
      }
    }
  }
};

const releaseLock = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
};

const readFileWithLock = async (filePath) => {
  await acquireLock(lockFilePath);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } finally {
    await releaseLock(lockFilePath);
  }
};

const writeFileWithLock = async (filePath, data) => {
  await acquireLock(lockFilePath);
  try {
    await fs.writeFile(filePath, data);
  } finally {
    await releaseLock(lockFilePath);
  }
};

app.http('UpdateUsers', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const tokenRequest = {
      scopes: ["https://graph.microsoft.com/.default"],
    };

    try {
      context.log("Acquiring token...");
      const authResponse = await cca.acquireTokenByClientCredential(tokenRequest);
      const accessToken = authResponse.accessToken;
      context.log("Token acquired successfully.");

      context.log("Fetching users from Microsoft Graph...");
      const response = await fetch("https://graph.microsoft.com/v1.0/groups/7d84630d-3a91-4e63-9cca-2b8da40b5d1f/members", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      context.log("Users fetched successfully.");
      context.log("Response from Microsoft Graph:", JSON.stringify(data, null, 2));

      const fetchedUsers = data.value.map(user => ({
        id: user.id,
        name: user.displayName,
        status: "available", // Default status
      }));

      let storedUsers = [];
      try {
        const usersFileContent = await readFileWithLock(usersFilePath);
        storedUsers = JSON.parse(usersFileContent);
      } catch (err) {
        context.log("No existing users file found, creating a new one.");
      }

      const updatedUsers = [...storedUsers];

      // Add new users
      fetchedUsers.forEach(fetchedUser => {
        if (!storedUsers.some(storedUser => storedUser.id === fetchedUser.id)) {
          updatedUsers.push(fetchedUser);
        }
      });

      // Remove missing users
      storedUsers.forEach(storedUser => {
        if (!fetchedUsers.some(fetchedUser => fetchedUser.id === storedUser.id)) {
          const index = updatedUsers.findIndex(user => user.id === storedUser.id);
          if (index !== -1) {
            updatedUsers.splice(index, 1);
          }
        }
      });

      await writeFileWithLock(usersFilePath, JSON.stringify(updatedUsers, null, 2));
      context.log("Users file updated successfully.");

      context.log("Users processed successfully.");
      context.log("Users:", JSON.stringify(updatedUsers, null, 2));

      context.log("Response set successfully.");
      return {
        status: 200,
        body: JSON.stringify({ users: updatedUsers }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Add CORS header
        }
      };
    } catch (error) {
      context.log("Error occurred:", error.message);
      return {
        status: 500,
        body: JSON.stringify({ error: error.message }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Add CORS header
        }
      };
    }
  }
});