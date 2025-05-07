FROM node:18-alpine

WORKDIR /app

RUN npm install @0xobelisk/sui-indexer@1.2.0-pre.13

COPY . .

RUN mkdir -p /app/.data && chmod 777 /app/.data

EXPOSE 3001

CMD ["npx", "sqlite-indexer", "--network", "testnet", "--schema-id", "0x8ece4cb6de126eb5c7a375f90c221bdc16c81ad8f6f894af08e0b6c25fb50a45", "--sqlite-filename", "/app/.data/indexer.db", "--pagination-limit", "9999"]
