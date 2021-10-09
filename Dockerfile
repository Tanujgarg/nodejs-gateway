FROM node:12.18.3-alpine

ENV NODE_ENV production

WORKDIR /app

COPY ./package.json /app/

RUN npm install

COPY ./.env /app/
COPY ./dist/ /app/

EXPOSE 3000
CMD npm run start-app
