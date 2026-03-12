# ─── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# نسخ ملفات الـ dependencies أولاً
# Docker يستخدم cache إذا لم تتغير package.json
COPY package*.json ./
RUN npm ci --only=production
RUN npm ci
# npm ci أسرع وأدق من npm install

COPY . .

# بناء المشروع
RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# نسخ فقط ما يلزم للتشغيل
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# مستخدم غير root للأمان
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]