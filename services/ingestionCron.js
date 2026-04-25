const cron = require("node-cron");
const { runWebIngestion } = require("./ingestionService");
const { archiveExpiredOpportunities } = require("./opportunity.service");

const PREDEFINED_QUERIES = [
  "food donation India",
  "NGO help needed education",
  "urgent relief work India"
];

function startIngestionCron() {
  const ingestionSchedule = "*/30 * * * *";
  const expirySchedule = "0 * * * *";

  const task = cron.schedule(
    ingestionSchedule,
    async () => {
      try {
        await runWebIngestion(PREDEFINED_QUERIES);
      } catch (error) {
        console.error("[INGESTION] cron execution failed:", error.message);
      }
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );

  const expiryTask = cron.schedule(
    expirySchedule,
    async () => {
      try {
        const archivedCount = await archiveExpiredOpportunities();
        console.log(`[EXPIRY] archived opportunities=${archivedCount}`);
      } catch (error) {
        console.error("[EXPIRY] cron execution failed:", error.message);
      }
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );

  console.log(`[INGESTION] cron started with schedule: ${ingestionSchedule}`);
  console.log(`[EXPIRY] cron started with schedule: ${expirySchedule}`);

  if (process.env.INGESTION_RUN_ON_STARTUP === "true") {
    runWebIngestion(PREDEFINED_QUERIES).catch((error) => {
      console.error("[INGESTION] startup execution failed:", error.message);
    });
  }

  return {
    ingestionTask: task,
    expiryTask
  };
}

module.exports = {
  startIngestionCron
};
