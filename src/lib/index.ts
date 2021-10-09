import { IncomingMessage } from 'http';
import { Options } from 'http-proxy-middleware';

export * from './response';
export * from './common';
export const globalOptions: Options = {
  target: '',
  changeOrigin: true,
  headers: {},
  onError: (err: any, request: any, response: any) => {
    response.send(err);
  },
  onProxyRes(proxyRes: IncomingMessage): void {
    proxyRes.headers['x-powered-by'] = 'BotPenguin';
    proxyRes.headers.Server = 'BotPenguin Server';
  },
  onProxyReq(proxyReq: any, request: any): void {
    if (request.headers['content-type'] && request.headers['content-type'].match(/^multipart\/form-data/)) {
      const formDataUser =
        `--${request.headers['content-type'].replace(/^.*boundary=(.*)$/, '$1')}\r\n` +
        'Content-Disposition: form-data; name="file"\r\n' +
        '\r\n' +
        `${JSON.stringify(request.user)}\r\n`;
      proxyReq.setHeader(
        'Content-Length',
        parseInt(request.headers['content-length'], 10) + formDataUser.length
      );

      proxyReq.write(formDataUser);
    } else {
      const bodyData = JSON.stringify(request.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  ssl: false,
  logLevel: 'error'
};
