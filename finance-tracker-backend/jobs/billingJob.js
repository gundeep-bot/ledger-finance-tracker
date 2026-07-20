const cron = require('node-cron');
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');

/**
 * Finds every active subscription whose nextBillingDate has arrived,
 * creates a corresponding Transaction, and advances nextBillingDate
 * by one billing cycle. Runs inside a session so a crash mid-run
 * can't create a transaction without advancing the date (or vice versa).
 */
async function runBillingCycle() {
  const now = new Date();
  const dueSubscriptions = await Subscription.find({
    isActive: true,
    nextBillingDate: { $lte: now },
  });

  if (dueSubscriptions.length === 0) {
    console.log(`[billingJob] ${now.toISOString()} — no subscriptions due`);
    return;
  }

  console.log(`[billingJob] ${now.toISOString()} — processing ${dueSubscriptions.length} due subscription(s)`);

  for (const sub of dueSubscriptions) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Transaction.create(
          [
            {
              user: sub.user,
              amount: sub.amount,
              category: sub.category,
              description: `Auto-billed: ${sub.name}`,
              date: sub.nextBillingDate,
              source: 'subscription',
              subscription: sub._id,
            },
          ],
          { session }
        );

        const nextDate = sub.computeNextBillingDate(sub.nextBillingDate);
        sub.lastBilledAt = sub.nextBillingDate;
        sub.nextBillingDate = nextDate;
        await sub.save({ session });
      });

      console.log(`[billingJob] billed "${sub.name}" for user ${sub.user}, next due ${sub.nextBillingDate.toISOString()}`);
    } catch (err) {
      console.error(`[billingJob] failed to bill subscription ${sub._id}:`, err.message);
      // Intentionally does not advance nextBillingDate on failure, so it's retried on the next run.
    } finally {
      session.endSession();
    }
  }
}

// Runs once every hour, at minute 0. Catches subscriptions due "today"
// without requiring exact-second precision.
function startBillingCron() {
  cron.schedule('0 * * * *', () => {
    runBillingCycle().catch((err) => console.error('[billingJob] unexpected error:', err));
  });
  console.log('[billingJob] cron scheduled: hourly');
}

module.exports = { startBillingCron, runBillingCycle };
