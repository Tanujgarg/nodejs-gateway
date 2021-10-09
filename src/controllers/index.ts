import { NextFunction, Request, Response, Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { globalOptions, makeResponse, Network } from '../lib';
import { ids } from '../lib/common/id';
import { authRequest, decryptPayload, encryptPayload, getCountry } from '../services';
import { adminController } from './admin';

const router = Router();

router.get('/old-website-widget/:oldId', getCountry, (req, res) => {
  const {oldId} = req.params;
  const {uuid} = req.query;
  const network = new Network();
  let user: any;

  let bot: any;

  const id: Array<{ id: string, encodedId: string }> | any = ids.find(i => i.encodedId === unescape(oldId));

  Promise.resolve()
    .then(() => network.get(`${process.env.BOT_SERVICE}bots/old/${id.id}`))
    .then(async (response: any) => {
      bot = response;

      const countries = bot.configuration.userAccessSettings.showInCountries;

      if (countries.length) {
        if (!countries.find((c: string) => c.toUpperCase() === (req.country || '').toUpperCase())) {
          return makeResponse(res, 400, false, 'Disabled in ' + req.country, undefined);
        }
      }

      return network.get(`${process.env.USER_SERVICE}internal/customer/${response._user}`);
    })
    .then(async response => {
      user = response;
      if (!['ACTIVE', 'LIMIT-OVER'].includes(user.status) || user.limitOver) {
        return await makeResponse(res, user.limitOver ? 402 : 403, false, `${user.limitOver ? 'Limit Exceeded!' : 'Account is ' + user.status}}`, undefined);
      }

      return network.post(`${process.env.MESSAGE_SERVICE}internal/create-uuid`, {
        _bot: bot._id,
        plan: user.plan,
        uuid,
        user
      });

    })
    .then(async message => {
      if (typeof message === 'number') {
        return undefined;
      }

      return await makeResponse(res, 200, true, bot.message, {
        ...bot,
        profile: encryptPayload(user),
        uuid: message.uuid,
        whiteLabel: user.whiteLabel
      });

    })
    .catch(async error => {
      await makeResponse(res, 400, false, error.message, undefined);
    });

});

router.get('/old-website-widget-landing/:oldId', getCountry, (req, res) => {
  const {oldId} = req.params;
  const {uuid} = req.query;
  const network = new Network();
  let user: any;

  let bot: any;

  Promise.resolve()
    .then(() => network.get(`${process.env.BOT_SERVICE}bots/old/${oldId}`))
    .then(async (response: any) => {
      bot = response;
      const countries = bot.configuration.userAccessSettings.showInCountries;

      if (countries.length) {
        if (!countries.find((c: string) => c.toUpperCase() === (req.country || '').toUpperCase())) {
          return makeResponse(res, 400, false, 'Disabled in ' + req.country, undefined);
        }
      }

      return network.get(`${process.env.USER_SERVICE}internal/customer/${response._user}`);
    })
    .then(async response => {
      user = response;
      if (!['ACTIVE', 'LIMIT-OVER'].includes(user.status) || user.limitOver) {
        return await makeResponse(res, user.limitOver ? 402 : 403, false, `${user.limitOver ? 'Limit Exceeded!' : 'Account is ' + user.status}}`, undefined);
      }

      return network.post(`${process.env.MESSAGE_SERVICE}internal/create-uuid`, {
        _bot: bot._id,
        plan: user.plan,
        uuid,
        user
      });

    })
    .then(async message => {
      if (typeof message === 'number') {
        return undefined;
      }

      return await makeResponse(res, 200, true, bot.message, {
        ...bot,
        profile: encryptPayload(user),
        uuid: message.uuid,
        whiteLabel: user.whiteLabel
      });

    })
    .catch(async error => {
      await makeResponse(res, 400, false, error.message, undefined);
    });

});

router.get('/website-widget/:_user/:_id', getCountry, (req, res) => {
  const {_user, _id} = req.params;
  const {uuid} = req.query;
  const network = new Network();
  let user: any;
  console.log('Country: ', req.country);
  network.get(`${process.env.USER_SERVICE}internal/customer/${_user}`)
    .then(async result => {
      user = result;

      return Promise.all([
        network.get(`${process.env.BOT_SERVICE}bots/${_id}`),
        network.post(`${process.env.MESSAGE_SERVICE}internal/create-uuid`, {
          _bot: _id,
          plan: user.plan,
          uuid,
          user
        })
      ]);
    })
    .then(async ([bot, message]) => {
      const countries = bot.configuration.userAccessSettings.showInCountries;
      if (countries.length) {
        if (!countries.find((c: string) => c.toUpperCase() === (req.country || '').toUpperCase())) {
          return makeResponse(res, 400, false, 'Disabled in ' + req.country, undefined);
        }
      }
      if (!['ACTIVE', 'LIMIT-OVER'].includes(user.status) || user.limitOver) {
        return await makeResponse(res, user.limitOver ? 402 : 403, false, `${user.limitOver ? 'Limit Exceeded!' : 'Account is ' + user.status}}`, undefined);
      }
      // console.log(req.headers.origin);
      // res.cookie('x-BotPenguin-origin', 'some-origin');

      await makeResponse(res, 200, true, bot.message, {
        ...bot,
        profile: encryptPayload(user),
        uuid: message.uuid,
        whiteLabel: user.whiteLabel
      });
    })
    .catch(async error => {
      await makeResponse(res, 400, false, error.message, undefined);
    });
});

router.post('/save-response', async (req, res) => {
  const network = new Network();
  try {
    const body: any = decryptPayload(req.body.binary, 'user-payload');
    res.sendStatus(202);
    await network.post(`${process.env.MESSAGE_SERVICE}internal/save-message`, {
      ...body,
      profile: decryptPayload(body.profile)
    });
  } catch (e) {
    console.log(e.message);
  }
});

router.post('/process-appointment', async (req, res) => {
  const network = new Network();
  try {
    res.sendStatus(202);
    await network.post(`${process.env.INTEGRATION_SERVICE}integrations/internal/process/google-calendar`, {
      ...req.body
    });
  } catch (e) {
    console.log(e.message);
  }
});

router.put('/update-meta', async (req, res) => {
  const network = new Network();
  try {
    const body: any = decryptPayload(req.body.binary, 'user-payload');
    res.sendStatus(202);
    await network.put(`${process.env.MESSAGE_SERVICE}internal/update-meta`, body);
  } catch (e) {
    console.log(e.message);
  }
});

router.use((req, res, next) => {
  req.url = req.url.replace(/\/api\/v1/g, '');
  req.originalUrl = req.originalUrl.replace(/\/api\/v1/g, '');
  next();
});

router.post('/upload', (req, res, next) => {
  const options: Options = {...globalOptions};
  options.target = process.env.UPLOAD_SERVICE;
  createProxyMiddleware(options)(req, res, next);
});

router.post('/webhook', (req, res, next) => {
  const options: Options = {...globalOptions};
  options.target = process.env.PAYMENT_SERVICE;
  createProxyMiddleware(options)(req, res, next);
});

router.post('/webhook/razorpay', (req, res, next) => {
  const options: Options = {...globalOptions};
  options.target = process.env.PAYMENT_SERVICE;
  createProxyMiddleware(options)(req, res, next);
});

router.get('/analytics/:target', (req, res, next) => {
  switch (req.params.target) {
    case 'customers-count': {
      const options: Options = {...globalOptions};
      options.target = process.env.USER_SERVICE;
      authRequest(req.token, options, req, res, next);
      break;
    }
    default: {
      res.sendStatus(405);
    }
  }
});

router.use('/admin', adminController);

router.use((req: Request, res: Response, next: NextFunction) => {
    const options = {...globalOptions};

    if (req.path.match(/\/bots/)) {
      options.target = process.env.BOT_SERVICE;
      authRequest(req.token, options, req, res, next);

    } else if (req.path.match(/communication/)) {
      if (req.method.toUpperCase() === 'GET') {
        options.target = process.env.MESSAGE_SERVICE;
        options.pathRewrite = {
          '^/communication/leads': '/leads',
          '^/communication/chats': '/chats',
          '^/communication/messages': '/messages',
          '^/communication/count': '/count'

        };
        authRequest(req.token, options, req, res, next);
      } else if (req.method.toUpperCase() === 'PUT') {
        options.target = process.env.MESSAGE_SERVICE;
        options.pathRewrite = {
          '^/communication/chats': '/chats'
        };
        authRequest(req.token, options, req, res, next);
      } else if (req.method.toUpperCase() === 'POST') {
        options.target = process.env.MESSAGE_SERVICE;
        options.pathRewrite = {
          '^/communication/messages': '/messages'
        };
        authRequest(req.token, options, req, res, next);
      } else {
        res.sendStatus(405);
      }
    } else if (req.path.match(/payment/)) {
      options.target = process.env.PAYMENT_SERVICE;
      options.pathRewrite = {
        '^/payment/plans': '/plans',
        '^/payment/cards': '/cards',
        '^/payment/charge': '/charge',
        '^/payment/coupons': '/coupons',
        '^/payment/subscription': '/subscription',
        '^/payment/transactions': '/transactions',
        '^/payment/billing-address': '/billing-address'
      };
      authRequest(req.token, options, req, res, next);
    } else if (req.path.match(/integrations/)) {
      options.target = process.env.INTEGRATION_SERVICE;
      authRequest(req.token, options, req, res, next);
    } else if (req.path.match(/facebook-automation/)) {
      options.target = process.env.FACEBOOK_AUTOMATION_SERVICE;
      authRequest(req.token, options, req, res, next);
    } else if (req.path.match(/unsubscribe/)) {
      options.target = process.env.NOTIFICATION_SERVICE;
      createProxyMiddleware(options)(req, res, next);
    } else if (req.path.match(/auth/)) {
      options.target = process.env.USER_SERVICE;
      createProxyMiddleware(options)(req, res, next);
    } else {
      options.target = process.env.USER_SERVICE;
      authRequest(req.token, options, req, res, next);
    }
  }
);

export const controller = router;
