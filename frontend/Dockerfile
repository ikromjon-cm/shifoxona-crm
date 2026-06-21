FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl && npm install -g serve

COPY --from=builder /app/dist /app/dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
