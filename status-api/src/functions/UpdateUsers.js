const { app } = require('@azure/functions');
const { ConfidentialClientApplication } = require("@azure/msal-node");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);
const dbFilePath = path.join(__dirname, 'users.db');
const containerName = "function-disk";
const blobName = "users.db";

// Function to download the database file from Azure Storage
const downloadDatabase = async () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  if (await blockBlobClient.exists()) {
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
    fs.writeFileSync(dbFilePath, downloaded);
  }
};

// Function to upload the database file to Azure Storage
const uploadDatabase = async () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const data = fs.readFileSync(dbFilePath);
  await blockBlobClient.upload(data, data.length);
};

// Helper function to convert stream to buffer
const streamToBuffer = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
};

// Function to initialize the database
const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        const newDb = new sqlite3.Database(dbFilePath, (err) => {
          if (err) {
            reject(new Error('Failed to create new database:', err.message));
          } else {
            newDb.run(`
              CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                status TEXT,
                text TEXT
              )
            `, (err) => {
              if (err) {
                reject(new Error('Error creating table:', err.message));
              } else {
                resolve(newDb);
              }
            });
          }
        });
      } else {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT,
            text TEXT
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
        text: "" // Default text set to empty string
      }));

      // Download the database file from Azure Storage
      context.log("Downloading database from Azure Storage...");
      await downloadDatabase();
      context.log("Database downloaded successfully.");

      const db = await initializeDatabase();
      context.log("Database initialized successfully.");

      await new Promise((resolve, reject) => {
        db.serialize(() => {
          const stmt = db.prepare(`
            INSERT INTO users (id, name, status, text)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              status = excluded.status,
              text = CASE WHEN excluded.text IS NOT NULL THEN excluded.text ELSE users.text END
          `);

          let completed = 0;
          fetchedUsers.forEach(user => {
            stmt.run(user.id, user.name, user.status, user.text, (err) => {
              if (err) {
                context.log(`Error running statement for user ${user.id}:`, err.message);
                reject(err);
              } else {
                completed++;
                if (completed === fetchedUsers.length) {
                  stmt.finalize((err) => {
                    if (err) {
                      context.log("Error finalizing statement:", err.message);
                      reject(err);
                    } else {
                      context.log("Statement finalized successfully.");
                      resolve();
                    }
                  });
                }
              }
            });
          });
        });
      });

      const users = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
          if (err) {
            context.log("Error fetching users from database:", err.message);
            reject(err);
          } else {
            context.log("Users fetched from database successfully.");
            resolve(rows);
          }
        });
      });

      // Upload the updated database file to Azure Storage
      context.log("Uploading updated database to Azure Storage...");
      await uploadDatabase();
      context.log("Database uploaded successfully.");

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
