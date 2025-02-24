const { app } = require('@azure/functions');
const { ConfidentialClientApplication } = require("@azure/msal-node");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

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

      const users = data.value.map(user => ({
        name: user.displayName,
        status: "available", // Default status, you can customize this
      }));

      // Example statuses for demonstration purposes
      const statuses = ["available", "lead", "absent", "busy"];
      users.forEach((user, index) => {
        user.status = statuses[index % statuses.length];
      });

      context.log("Users processed successfully.");

      // log the users
      context.log("Users:", JSON.stringify(users, null, 2));

      context.log("Response set successfully.");
      return {
        status: 200,
        body: JSON.stringify({ users }),
        headers: { "Content-Type": "application/json" }
      };
    } catch (error) {
      context.log("Error occurred:", error.message);
      return {
        status: 500,
        body: JSON.stringify({ error: error.message }),
        headers: { "Content-Type": "application/json" }
      };
    }
  }
});
