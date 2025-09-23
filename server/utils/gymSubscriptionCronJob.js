import cron from "node-cron";
import { GymUsers } from "../model/gymUserSchema.js";

// Run every midnight
cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  try {
    // Mark expired subscriptions
    await GymUsers.updateMany(
      { "subscription.endDate": { $lt: now } },
      { $set: { "subscription.status": "expired" } }
    );

    // Mark active subscriptions
    await GymUsers.updateMany(
      { "subscription.startDate": { $lte: now }, "subscription.endDate": { $gte: now } },
      { $set: { "subscription.status": "active" } }
    );

    console.log("✅ Subscription statuses updated at", now.toISOString());
  } catch (err) {
    console.error("❌ Error updating subscription statuses:", err);
  }
});


