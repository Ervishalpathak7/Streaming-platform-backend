FROM node:lts-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
