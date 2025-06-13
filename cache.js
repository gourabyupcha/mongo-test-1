// const { createClient } = require('redis');
// require('dotenv').config();

// const redisClient = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379'
// });

// redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

// (async () => {
//   await redisClient.connect();
//   console.log('✅ Connected to Redis');
// })();

// module.exports = redisClient;

const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT
  }
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

(async () => {
  await redisClient.connect();
  console.log('✅ Connected to Redis');
})();

module.exports = redisClient;
