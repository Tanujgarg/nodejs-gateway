require('dotenv')
  .config();
import express from 'express';
import { appLoader } from './src/loaders';
import { loadRedis } from './src/loaders/redis';
import { router } from './src/routers';

process.on('uncaughtException', err => {
  console.log(' UNCAUGHT EXCEPTION ');
  console.log('[Inside \'uncaughtException\' event] ' + err.stack || err.message);
});
process.on('unhandledRejection',
  (reason, promise) => {
    console.log(' UNHANDLED REJECTION ');
    console.log('Unhandled Rejection at: ', promise, 'REASON: ', reason);
  });

const app = express();
loadRedis()
  .then(() => appLoader(app, router))
  .catch(() => {
    process.exit(1);
  });

declare global {
  namespace Express {
    interface Request {
      token?: any;
      country?: string;
    }
  }
}
