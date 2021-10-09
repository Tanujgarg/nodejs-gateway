import redis, { RedisClient } from 'redis';

const loadRedis = async () => new Promise((resolve, reject) => {
  const redisClient: RedisClient = redis.createClient(6379, String(process.env.REDIS));
  (global as any).redisClient = redisClient;
  redisClient.on('error', (err: any) => {
    console.log('redis', err);
    reject(err);
  });
  redisClient.on('connect', () => {
    console.log('Redis', 'Connected');
    resolve();
  });
});

export { loadRedis };
