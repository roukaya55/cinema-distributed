// booking-service/consumers/paymentConsumer.js
const { createChannel } = require('../config/mq');
const Booking = require('../models/bookingModel');
const Cart = require('../models/cartModel');
const axios = require('axios');
const pool = require('../config/db'); // to update block_hash

async function startPaymentConsumer() {
  const { ch, conn, exchange } = await createChannel();

  const queue = 'booking.payment.success';
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, exchange, 'payment.success');

  console.log('📥 booking-service listening on payment.success');

  ch.consume(queue, async msg => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { userId, items = [], method = 'N/A' } = payload;

      for (const item of items) {
        // 1️⃣ Create booking
        const bookingId = await Booking.create(
          userId,
          item.showtimeId,
          item.price ?? 0,
          method
        );

        // 2️⃣ Assign seats
        if (Array.isArray(item.seatIds) && item.seatIds.length > 0) {
          await Booking.addBookedSeats(bookingId, item.seatIds, item.showtimeId);
        }

        // 3️⃣ Create blockchain block
        try {
          const blockchainURL = process.env.BLOCKCHAIN_URL || "http://localhost:4006/api/blockchain/add";

          const blockResult = await axios.post(blockchainURL, {
            type: "booking",
            refId: bookingId,
            data: {
              bookingId,
              userId,
              showtimeId: item.showtimeId,
              seatIds: item.seatIds,
              price: item.price ?? 0,
              timestamp: new Date().toISOString()
            }
          });

          const blockHash = blockResult?.data?.block?.hash;

          if (blockHash) {
            await pool.query(
              `UPDATE bookings SET block_hash=$1 WHERE booking_id=$2`,
              [blockHash, bookingId]
            );
            console.log("🧱 Blockchain block saved for booking:", bookingId);
          }

        } catch (chainErr) {
          console.error("⚠️ Blockchain service error:", chainErr.message);
        }
      }

      // 4️⃣ Clear cart after success
      if (userId) await Cart.clearAllForUser(userId);

      ch.ack(msg);
      console.log("✅ booking-service processed payment.success", payload);

    } catch (error) {
      console.error("❌ booking-service consumer error:", error.message);
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
