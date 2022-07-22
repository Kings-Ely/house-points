FROM node:16

WORKDIR /usr/src/app

COPY . .

RUN npm i

EXPOSE 4464

CMD ["node", "index.js", "--port", "4464", "--log=3"]
