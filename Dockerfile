# syntax=docker/dockerfile:1
FROM node:12.18.1
ENV NODE_ENV=production
WORKDIR /bobcat
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD ["node", "dist/index.js"]
