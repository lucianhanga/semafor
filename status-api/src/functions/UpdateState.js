const { app } = require('@azure/functions');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFilePath = path.join(__dirname, 'users.db');

// Initialize the database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        status TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  }
});

app.http('UpdateState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const requestBody = await request.json();
      context.log("Request body:", JSON.stringify(requestBody, null, 2));

      const { id, name, status } = requestBody;

      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run(`
            INSERT INTO users (id, name, status)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              status = excluded.status
          `, [id, name, status], (err) => {
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