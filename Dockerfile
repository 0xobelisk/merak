FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/.data && chmod 777 /app/.data

EXPOSE 3001

CMD ["pnpm", "sqlite-indexer", "--network", "testnet", "--sqlite-filename", "/app/.data/indexer.db", "--pagination-limit", "9999"]
