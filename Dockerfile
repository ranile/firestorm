FROM node:18 as builder

WORKDIR /app
COPY package.json package-lock.json /app
RUN npm install
COPY . .
RUN npm run wasm:link
RUN npm run build

FROM node:18 as runner
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json /app/build/ /app
RUN npm ci --omit dev
EXPOSE 3000
CMD ["node", "."]
