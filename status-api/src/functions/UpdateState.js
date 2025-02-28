const { app } = require('@azure/functions');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbFilePath = path.join(__dirname, 'users.db');

app.http('UpdateState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    // Check if the database file exists
    if (!fs.existsSync(dbFilePath)) {
      context.log("Database file does not exist.");
      return {
        status: 500,
        body: JSON.stringify({ error: "Database file does not exist." }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Add CORS header
        }
      };
    }

    // Initialize the database
    const db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      }
    });

    try {
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