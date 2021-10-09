import request from 'request';

class Network {
  http = async (url: string, method: string, body: any = undefined) => new Promise<any>((resolve, reject) => {
    request(url, {
      method,
      body,
      json: true
    }, (error, response, data) => {
      if (error) {
        reject(error);
      } else {
        if (response.statusCode === 200 || response.statusCode === 201) {

          resolve(data.data);
        } else {
          reject(data);
        }
      }
    });
  });

  get = async (url: string) => this.http(url, 'GET');

  post = async (url: string, body: any) => this.http(url, 'POST', body);
  put = async (url: string, body: any) => this.http(url, 'PUT', body);

}

export { Network };
