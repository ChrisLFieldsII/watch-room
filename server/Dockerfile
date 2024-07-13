FROM node:18-alpine
WORKDIR /server
COPY . .
RUN corepack enable
RUN --mount=type=secret,id=npmrc,target=/server/.npmrc yarn install --immutable
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start:prod"]
