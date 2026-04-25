const cron = require("node-cron");
const { runWebIngestion } = require("./ingestionService");

const PREDEFINED_QUERIES = [
  "food donation India",
  "NGO help needed education",
  "urgent relief work India"
];

function startIngestionCron() {
  const schedule = "*/30 * * * *";

  const task = cron.schedule(
    schedule,
    async () => {
      try {
        await runWebIngestion(PREDEFINED_QUERIES);
      } catch (error) {
        console.error("[INGESTION] cron execution failed:", error.message);
      }
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );

  console.log(`[INGESTION] cron started with schedule: ${schedule}`);

  if (process.env.INGESTION_RUN_ON_STARTUP === "true") {
    runWebIngestion(PREDEFINED_QUERIES).catch((error) => {
      console.error("[INGESTION] startup execution failed:", error.message);
    });
  }

  return task;
}

module.exports = {
  startIngestionCron
};
