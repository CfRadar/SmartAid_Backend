const mongoose = require("mongoose");

async function connectDB() {
	const mongoUri = process.env.MONGODB_URI;

	if (!mongoUri) {
		throw new Error("MONGODB_URI is not configured in environment variables");
	}

	mongoose.set("strictQuery", true);

	const connection = await mongoose.connect(mongoUri, {
		dbName: process.env.MONGODB_DB_NAME
	});

	// eslint-disable-next-line no-console
	console.log(`MongoDB connected: ${connection.connection.host}`);
}

module.exports = connectDB;
