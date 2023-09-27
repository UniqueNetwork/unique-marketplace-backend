FROM node:18-alpine3.17
RUN mkdir /app
WORKDIR /app
COPY . /app/
RUN npm ci
RUN npm run build:all
