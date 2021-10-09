import { Router } from 'express';
import { controller } from '../controllers';
import { extractToken } from '../middlewares';

const router = Router();
router.use(extractToken);
router.use('/', controller);

export { router };
