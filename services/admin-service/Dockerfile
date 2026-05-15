FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN mkdir -p logs

EXPOSE 3012

CMD ["node", "src/index.js"]
