require("dotenv").config();

const compression = require("compression");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const apiRoutes = require("./routes");
const { startIngestionCron } = require("./services/ingestionCron");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
}

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

async function start() {
	try {
		await connectDB();
		if (process.env.INGESTION_CRON_ENABLED !== "false") {
			startIngestionCron();
		}
		app.listen(PORT, () => {
			// eslint-disable-next-line no-console
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

start();

module.exports = app;
