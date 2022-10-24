FROM node:16 AS node
FROM php:7.4-fpm

WORKDIR /app

COPY . .

EXPOSE 4464

CMD [ "node", "--enable-source-maps", "index.js" ]
