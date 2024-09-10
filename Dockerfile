# Stage 1: Build
FROM node:14.17.5 AS build

WORKDIR /usr/src/app

COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:14.17.5

ENV ELASTIC_APM_ACTIVE=false
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/build ./build
RUN npm install --only=production
EXPOSE 3004
CMD [ "npm", "start" ]

#docker build -t brigingapi .
#docker run -p 3004:3004 -d brigingapi