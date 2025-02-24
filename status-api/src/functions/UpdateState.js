const { app } = require('@azure/functions');
const fs = require('fs').promises;
const path = require('path');

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

app.http('UpdateState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const requestBody = await request.json();
      context.log("Request body:", JSON.stringify(requestBody, null, 2));

      let users = [];
      try {
        const usersFileContent = await readFileWithLock(usersFilePath);
        users = JSON.parse(usersFileContent);
      } catch (err) {
        context.log("No existing users file found, creating a new one.");
      }

      // Find the user by ID and update the user data
      const userIndex = users.findIndex(user => user.id === requestBody.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...requestBody };
        await writeFileWithLock(usersFilePath, JSON.stringify(users, null, 2));
        context.log("Users file updated successfully.");
      } else {
        context.log("User ID not found, no updates made.");
      }

      context.log("Response set successfully.");
      return {
        status: 200,
        body: JSON.stringify({ users }),
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