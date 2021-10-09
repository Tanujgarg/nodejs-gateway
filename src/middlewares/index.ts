import { NextFunction, Request, Response } from 'express';

const extractToken = (req: Request, res: Response, next: NextFunction) => {
  const {authorization} = req.headers as any;
  req.token = authorization
    ? authorization.split(' ')[1]
    : (req.query.access_token || req.body.access_token);
  next();
};

export { extractToken };
