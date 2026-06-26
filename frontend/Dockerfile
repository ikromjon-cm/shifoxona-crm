FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

RUN addgroup --system frontend && adduser --system --ingroup frontend frontend && \
    npm install -g serve && npm cache clean --force

COPY --from=builder --chown=frontend:frontend /app/dist /app/dist

USER frontend
WORKDIR /app
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
