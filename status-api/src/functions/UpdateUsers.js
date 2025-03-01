const { app } = require('@azure/functions');
const { ConfidentialClientApplication } = require("@azure/msal-node");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { TableClient } = require('@azure/data-tables');

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);
const tableName = "Users";
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableClient = TableClient.fromConnectionString(connectionString, tableName);

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
        partitionKey: "Users",
        rowKey: user.id,
        name: user.displayName,
        status: "absent", // Default status set to "absent"
        text: "" // Default text set to empty string
      }));

      context.log("Inserting or updating users in Azure Table Storage...");
      for (const user of fetchedUsers) {
        try {
          // Check if the user already exists
          await tableClient.getEntity(user.partitionKey, user.rowKey);
          context.log(`User with ID ${user.rowKey} already exists. Skipping update.`);
        } catch (error) {
          if (error.statusCode === 404) {
            // User does not exist, insert the user
            await tableClient.upsertEntity(user, "Merge");
            context.log(`User with ID ${user.rowKey} inserted successfully.`);
          } else {
            throw error;
          }
        }
      }
      context.log("Users inserted or updated successfully.");

      const users = [];
      const entitiesIter = tableClient.listEntities();
      for await (const entity of entitiesIter) {
        users.push(entity);
      }
      context.log("Users fetched from Azure Table Storage successfully.");

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
