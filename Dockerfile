FROM node:18-alpine

WORKDIR /app

RUN npm install @0xobelisk/sui-indexer@1.1.14

COPY . .

RUN mkdir -p /app/.data && chmod 777 /app/.data

EXPOSE 3001

CMD ["npx", "sqlite-indexer", "--network", "testnet", "--schema-id", "0xa565cbb3641fff8f7e8ef384b215808db5f1837aa72c1cca1803b5d973699aac", "--sqlite-filename", "/app/.data/indexer.db", "--pagination-limit", "9999"]
