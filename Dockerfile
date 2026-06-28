FROM node:20-slim

WORKDIR /app

# 安装 Prisma 需要的 OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 1. 安装客户端依赖并构建
COPY h5-client/package*.json h5-client/
RUN cd h5-client && npm install
COPY h5-client/ h5-client/
RUN cd h5-client && npm run build

# 2. 安装服务端依赖（含 Prisma 客户端生成）
COPY h5-server/package*.json h5-server/
COPY h5-server/prisma h5-server/prisma/
RUN cd h5-server && npm install && npx prisma generate

# 3. 复制服务端源码
COPY h5-server/ h5-server/

# 4. 暴露端口
EXPOSE 3001

# 5. 启动：数据库迁移 + 运行服务
ENV NODE_ENV=production
CMD cd h5-server && npx prisma db push && npx tsx src/index.ts
