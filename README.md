# H5 移动商城 (C端)

基于 Vue 3 + Vant 4 + Express + Prisma 的 H5 移动端商城项目。

## 项目架构

```
app-project/
├── h5-server/              # 后端服务 (Express + TypeScript + Prisma)
│   ├── prisma/
│   │   └── schema.prisma   # 数据模型（共享 rbac_db）
│   └── src/
│       ├── index.ts         # 入口
│       ├── app.ts           # Express 配置
│       ├── config.ts        # 环境变量
│       ├── middleware/
│       │   └── auth.ts      # Member JWT 认证
│       ├── controllers/     # 业务控制器
│       │   ├── auth.ts      # 注册/登录/个人信息
│       │   ├── home.ts      # 首页聚合
│       │   ├── banners.ts   # Banner管理
│       │   ├── categories.ts # 商品分类
│       │   ├── products.ts  # 商品列表/搜索/详情
│       │   ├── cart.ts      # 购物车
│       │   ├── addresses.ts # 收货地址
│       │   ├── orders.ts    # 订单
│       │   └── favorites.ts # 收藏
│       ├── routes/index.ts  # 路由挂载 /api/member/*
│       └── utils/           # 工具函数
│
├── h5-client/              # 前端 (Vue 3 + Vite + Vant 4)
│   └── src/
│       ├── main.ts          # 入口
│       ├── App.vue          # 根组件
│       ├── api/             # API 层 (Axios)
│       ├── stores/          # Pinia 状态管理
│       │   ├── auth.ts      # 登录状态
│       │   ├── cart.ts      # 购物车
│       │   └── address.ts   # 地址
│       ├── router/          # Vue Router + 路由守卫
│       ├── components/      # 公共组件
│       ├── layouts/         # MainLayout (TabBar)
│       ├── pages/           # 页面组件
│       │   ├── login/       # 登录
│       │   ├── register/    # 注册
│       │   ├── home/        # 首页
│       │   ├── category/    # 分类
│       │   ├── search/      # 搜索（实时联想+筛选）
│       │   ├── product/     # 商品详情
│       │   ├── cart/        # 购物车
│       │   ├── checkout/    # 确认订单
│       │   ├── order/       # 订单列表/详情
│       │   ├── address/     # 地址管理
│       │   ├── favorite/    # 我的收藏
│       │   └── profile/     # 个人中心
│       ├── types/           # TypeScript 类型
│       ├── styles/          # 全局样式（Vant 主题覆盖）
│       └── utils/           # 工具函数
│
└── package.json             # 根脚本
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Vue 3 (Composition API) |
| UI 组件库 | Vant 4 |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP 客户端 | Axios |
| 构建工具 | Vite 6 |
| 后端框架 | Express 4 |
| ORM | Prisma 5 |
| 数据库 | MySQL (rbac_db) |
| 认证 | JWT (Member 独立) |
| 语言 | TypeScript |

## 数据库

与管理端共享 `rbac_db` 数据库，C端新增表：

| 表 | 说明 |
|---|---|
| Member | C端会员（独立于管理端 User） |
| Address | 收货地址 |
| Cart | 购物车 |
| Banner | 首页轮播 |
| Favorite | 商品收藏 |
| Order (修改) | 新增 memberId 列 |

## API 总览

所有 C 端接口前缀 `/api/member`，统一响应格式：

```json
{ "code": 0, "message": "ok", "data": {} }
```

| 模块 | 端点 | 认证 |
|---|---|---|
| Auth | POST /auth/register, /auth/login | - |
| | GET /auth/me, PUT /auth/profile | ✓ |
| Home | GET /home | - |
| Products | GET /products, /products/:id | - |
| Categories | GET /categories/tree | - |
| Cart | CRUD /cart | ✓ |
| Addresses | CRUD /addresses | ✓ |
| Orders | POST /orders, GET /orders | ✓ |
| Favorites | GET/POST/DELETE /favorites | ✓ |
| Banners | GET /banners | - |

## 启动

```bash
# 安装依赖
npm run install:all

# 启动后端 (端口 3001)
npm run dev:server

# 启动前端 (端口 5174)
npm run dev:client
```

## 环境变量

`h5-server/.env`：
```
DATABASE_URL=mysql://root:root123456@localhost:3306/rbac_db
MEMBER_JWT_SECRET=h5-member-jwt-secret-2024
MEMBER_JWT_EXPIRES_IN=30d
PORT=3001
```
