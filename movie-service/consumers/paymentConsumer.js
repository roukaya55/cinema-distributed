// movie-service/consumers/paymentConsumer.js

const { createChannel } = require('../config/mq');
const pool = require('../config/db');

async function startPaymentConsumer() {
  const { ch, conn, exchange } = await createChannel();

  const queue = 'movie.payment.success';
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, exchange, 'payment.success');

  console.log('🎬 movie-service listening on payment.success');

  ch.consume(queue, async msg => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { paymentId, items = [] } = payload;

      console.log("📩 Received payment.success in movie-service:", payload);

      // ----------------------------------------------
      // 1️⃣ IDEMPOTENCY CHECK
      // ----------------------------------------------
      const exists = await pool.query(
        `SELECT 1 FROM processed_payments WHERE payment_id = $1`,
        [paymentId]
      );

      if (exists.rowCount > 0) {
        console.log("⚠️ Duplicate payment event ignored in movie-service:", paymentId);
        ch.ack(msg);
        return;
      }

      // Mark this payment as processed
      await pool.query(
        `INSERT INTO processed_payments (payment_id) VALUES ($1)`,
        [paymentId]
      );

      // ----------------------------------------------
      // 2️⃣ SAFE SEAT UPDATES (no duplicates)
      // ----------------------------------------------
      for (const item of items) {
        const { showtimeId, seatIds } = item;

        if (!Array.isArray(seatIds)) continue;

        for (const seatId of seatIds) {
          await pool.query(
            `INSERT INTO booked_seats (showtime_id, seat_id)
             VALUES ($1, $2)
             ON CONFLICT (showtime_id, seat_id) DO NOTHING`,
            [showtimeId, seatId]
          );
        }
      }

      console.log("✅ movie-service updated booked_seats safely");
      ch.ack(msg);

    } catch (err) {
      console.error("❌ movie-service consumer error:", err.message);
      ch.nack(msg, false, false);
    }
  });

  process.on("SIGINT", async () => {
    try {
      await ch.close();
      await conn.close();
    } catch {}
    process.exit(0);
  });
}

module.exports = { startPaymentConsumer };
