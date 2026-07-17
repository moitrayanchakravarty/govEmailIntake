const { MongoClient } = require("mongodb");
const env = require("./env");

const client = new MongoClient(env.MONGO_URI);

module.exports = client;