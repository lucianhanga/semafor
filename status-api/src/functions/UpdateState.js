const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const tableName = "Users";
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableClient = TableClient.fromConnectionString(connectionString, tableName);

app.http('UpdateState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const requestBody = await request.json();
      context.log("Request body:", JSON.stringify(requestBody, null, 2));

      const { id, status, text } = requestBody;

      // Fetch the user entity from Azure Table Storage
      let userEntity;
      try {
        userEntity = await tableClient.getEntity("Users", id);
      } catch (error) {
        if (error.statusCode === 404) {
          context.log("User not found.");
          return {
            status: 404,
            body: JSON.stringify({ error: "User not found" }),
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*", // Add CORS header
            }
          };
        } else {
          throw error;
        }
      }

      // Update the user entity
      userEntity.status = status;
      if (text !== undefined) {
        userEntity.text = text;
      }

      await tableClient.updateEntity(userEntity, "Merge");
      context.log("User updated successfully.");

      // Fetch all users from Azure Table Storage
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