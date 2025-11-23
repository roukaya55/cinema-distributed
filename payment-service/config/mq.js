// payment-service/config/mq.js
const amqplib = require('amqplib');

let connection;
let channel;

async function connectMQ() {
  if (channel) return channel;
  connection = await amqplib.connect(process.env.RABBITMQ_URL);
  channel = await connection.createConfirmChannel();

  const exchange = process.env.RABBITMQ_EXCHANGE || 'cinema.events';
  await channel.assertExchange(exchange, 'topic', { durable: true });

  console.log('🐇 payment-service connected to RabbitMQ');
  return channel;
}

async function publishEvent(routingKey, payload) {
  const ch = await connectMQ();
  const exchange = process.env.RABBITMQ_EXCHANGE || 'cinema.events';
  const msg = Buffer.from(JSON.stringify(payload));

  ch.publish(exchange, routingKey, msg, { contentType: 'application/json', persistent: true });
  await ch.waitForConfirms(); // safety confirm
  console.log(`📣 published -> ${routingKey}`, payload);
}

process.on('SIGINT', async () => { try { await connection?.close(); } catch {} process.exit(0); });

module.exports = { connectMQ, publishEvent };
