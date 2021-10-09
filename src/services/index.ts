import CryptoJS from 'crypto-js';
import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import request from 'request';
import requestPromise from 'request-promise';
import { makeResponse } from '../lib';

const getUserProfile = async (token: string) => new Promise((resolve, reject) => {
  request.get(`${process.env.USER_SERVICE}internal/validate-session`, {
    qs: {
      token
    },
    headers: {
      'Content-Type': 'application/json'
    },
    json: true
  }, ((error, response, body) => {
    if (response.statusCode === 200) {
      resolve(body);
    } else {
      reject(body);
    }
  }));
});

const authRequest = (token: string, options: Options, req: Request, res: Response, next: NextFunction, checkRole = '') => {
  getUserProfile(token)
    .then(async (userProfile: any) => {
      delete userProfile.data.meta;
      options.headers = {
        'x-user-profile': JSON.stringify(userProfile.data)
      };
      if (checkRole && userProfile.data.type !== checkRole) {
        await makeResponse(res, 403, false, 'invalid role', undefined);
      } else {
        if (checkRole === 'ADMIN') {
          createProxyMiddleware(options)(req, res, next);
        } else {
          createProxyMiddleware(options)(req, res, next);
        }

      }
    })
    .catch(async error => {
      await makeResponse(res, 401, false, error.message, undefined);
    });
};

const encryptPayload = (payload: any): string => {
  const newPayload = JSON.stringify(payload);

  return CryptoJS
    .AES
    .encrypt(newPayload, 'botpenguin')
    .toString();
};

const decryptPayload = (payload: string, key = 'botpenguin'): any => {
  return JSON.parse(CryptoJS
    .AES
    .decrypt(payload, key)
    .toString(CryptoJS.enc.Utf8));
};

const getCountry = (req: Request, res: Response, next: NextFunction) => {
  requestPromise({
    uri: `https://json.geoiplookup.io/${req.get('x-real-ip')}`,
    method: 'GET',
    json: true
  })
    .then((data: any) => {
      req.country = data.country_name || '';
      next();
    })
    .catch(() => {
      req.country = '';
      next();
    });
  // http://ip-api.com/json/24.48.0.1
};

export { getUserProfile, authRequest, encryptPayload, decryptPayload, getCountry };
