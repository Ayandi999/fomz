import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";
import { env } from "./env";
import FormService from "@repo/services/form";

const formService = new FormService();

async function init() {
  try {
    const server = http.createServer(expressApplication);
    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`http server is running on PORT ${PORT}`);
    });

    // Run background cron loop every 30 seconds to check and send digests for expired forms
    setInterval(async () => {
      try {
        await formService.checkAndSendExpiredFormDigests();
      } catch (err) {
        logger.error("Error in background expired digests cron:", err);
      }
    }, 30000);
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();
