FROM node:22-slim AS build
WORKDIR /app
RUN npm i -g pnpm@10.13.1
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -F firstly-atproto build
RUN pnpm --filter firstly-atproto deploy --prod --legacy /deploy

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /app/apps/atproto/package.json ./
COPY --from=build /app/apps/atproto/build ./build
EXPOSE 3000
CMD ["node", "build"]
