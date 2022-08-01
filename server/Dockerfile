FROM node:16

WORKDIR /app

COPY . .

RUN npm i

EXPOSE 4464

CMD [ "node", "--enable-source-maps", "index.js", "-cv" ]
