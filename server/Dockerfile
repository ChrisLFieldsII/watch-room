FROM node:18-alpine
WORKDIR /server
COPY . .
RUN corepack enable
RUN yarn install --immutable
RUN yarn build
EXPOSE 3000 8080
CMD ["yarn", "start:prod"]
