const { app } = require('@azure/functions');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');

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

app.http('UpdateState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      // Download the database file from Azure Storage
      await downloadDatabase();

      // Initialize the database
      const db = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
        }
      });

      const requestBody = await request.json();
      context.log("Request body:", JSON.stringify(requestBody, null, 2));

      const { id, status, text } = requestBody;

      await new Promise((resolve, reject) => {
        db.serialize(() => {
          const updateQuery = `
            UPDATE users
            SET status = ?, text = COALESCE(?, text)
            WHERE id = ?
          `;
          const params = [status, text !== undefined ? text : null, id];

          db.run(updateQuery, params, (err) => {
            if (err) {
              context.log("Error updating user:", err.message);
              reject({
                status: 500,
                body: JSON.stringify({ error: err.message }),
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*", // Add CORS header
                }
              });
            } else {
              context.log("User updated successfully.");
              resolve();
            }
          });
        });
      });

      const users = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
          if (err) {
            context.log("Error fetching users:", err.message);
            reject({
              status: 500,
              body: JSON.stringify({ error: err.message }),
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Add CORS header
              }
            });
          } else {
            context.log("Users fetched successfully.");
            resolve(rows);
          }
        });
      });

      // Upload the updated database file to Azure Storage
      await uploadDatabase();

      // log the users
      context.log("Users:", JSON.stringify(users, null, 2));

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