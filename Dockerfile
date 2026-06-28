FROM node:20-slim

WORKDIR /app

# 系统依赖
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 1. 构建客户端
COPY h5-client/package*.json h5-client/
RUN cd h5-client && npm install
COPY h5-client/ h5-client/
RUN cd h5-client && npm run build

# 2. 服务端依赖
COPY h5-server/package*.json h5-server/
COPY h5-server/prisma h5-server/prisma/
RUN cd h5-server && npm install && npx prisma generate

# 3. 复制服务端源码
COPY h5-server/ h5-server/

# 4. 暴露端口
EXPOSE 3001
ENV NODE_ENV=production

# 5. 启动：等待数据库就绪 → 推送表结构 → 运行服务
CMD cd h5-server && \
    echo "Waiting for database..." && \
    npx prisma db push --accept-data-loss && \
    echo "Seeding data..." && \
    npx prisma db seed && \
    echo "Migrating product descriptions..." && \
    npx tsx prisma/migrate-product-descriptions.ts && \
    echo "Starting server..." && \
    npx tsx src/index.ts
