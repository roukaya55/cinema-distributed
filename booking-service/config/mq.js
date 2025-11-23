// booking-service/config/mq.js
const amqplib = require('amqplib');

async function createChannel() {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();
  const exchange = process.env.RABBITMQ_EXCHANGE || 'cinema.events';
  await ch.assertExchange(exchange, 'topic', { durable: true });
  return { conn, ch, exchange };
}

module.exports = { createChannel };
