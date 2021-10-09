import express from 'express';
import { Options } from 'http-proxy-middleware';
import { globalOptions } from '../../lib';
import { authRequest } from '../../services';

const router = express.Router();


router.use('/user/*', (req, res, next) => {
  console.log(req.originalUrl);
  req.originalUrl = req.originalUrl.replace(/\/user/g, '');
  const options: Options = {...globalOptions};
  options.target = process.env.USER_SERVICE;
  authRequest(req.token, options, req, res, next, 'ADMIN');
});

router.use('/bot/*', (req, res, next) => {
  console.log(req.originalUrl);
  req.originalUrl = req.originalUrl.replace(/\/bot/g, '');
  const options: Options = {...globalOptions};
  options.target = process.env.BOT_SERVICE;
  authRequest(req.token, options, req, res, next, 'ADMIN');
});

router.use('/message/*', (req, res, next) => {
  console.log(req.originalUrl);
  req.originalUrl = req.originalUrl.replace(/\/message/g, '');
  const options: Options = {...globalOptions};
  options.target = process.env.MESSAGE_SERVICE;
  authRequest(req.token, options, req, res, next, 'ADMIN');
});
router.use('/fb/*', (req, res, next) => {
  console.log(req.originalUrl);
  req.originalUrl = req.originalUrl.replace(/\/fb/g, '');
  const options: Options = {...globalOptions};
  options.target = process.env.FACEBOOK_AUTOMATION_SERVICE;
  authRequest(req.token, options, req, res, next, 'ADMIN');
});
export const adminController = router;
