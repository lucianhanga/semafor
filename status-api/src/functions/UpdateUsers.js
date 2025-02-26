const { app } = require('@azure/functions');
const { ConfidentialClientApplication } = require("@azure/msal-node");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);
const dbFilePath = path.join(__dirname, 'users.db');

// Function to initialize the database with retry mechanism
const initializeDatabase = async (retries = 10, delay = 100) => {
  return new Promise((resolve, reject) => {
    const tryOpenDatabase = (attempt) => {
      const db = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
          if (attempt < retries) {
            console.error(`Error opening database (attempt ${attempt + 1}):`, err.message);
            setTimeout(() => tryOpenDatabase(attempt + 1), delay);
          } else {
            reject(new Error('Failed to open database after multiple attempts'));
          }
        } else {
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT,
              status TEXT
            )
          `, (err) => {
            if (err) {
              reject(new Error('Error creating table:', err.message));
            } else {
              resolve(db);
            }
          });
        }
      });
    };
    tryOpenDatabase(0);
  });
};

app.http('UpdateUsers', {
  methods: ['GET'],
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

      const fetchedUsers = data.value.map(user => ({
        id: user.id,
        name: user.displayName,
        status: "absent", // Default status set to "absent"
      }));

      const db = await initializeDatabase();

      await new Promise((resolve, reject) => {
        db.serialize(() => {
          const stmt = db.prepare(`
            INSERT INTO users (id, name, status)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              status = excluded.status
          `);

          fetchedUsers.forEach(user => {
            db.get("SELECT id FROM users WHERE id = ?", [user.id], (err, row) => {
              if (err) {
                reject(err);
              } else if (!row) {
                stmt.run(user.id, user.name, user.status);
              }
            });
          });

          stmt.finalize((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      const users = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      context.log("Users fetched successfully.");
      context.log("Before returning users:", JSON.stringify(users, null, 2));

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
