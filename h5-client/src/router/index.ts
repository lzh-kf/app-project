import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        // ========== Tab 页（显示底部导航） ==========
        { path: '', name: 'Home', component: () => import('@/pages/home/index.vue'), meta: { title: '首页', tabbar: true } },
        { path: 'category', name: 'Category', component: () => import('@/pages/category/index.vue'), meta: { title: '分类', tabbar: true } },
        { path: 'cart', name: 'Cart', component: () => import('@/pages/cart/index.vue'), meta: { title: '购物车', tabbar: true, requiresAuth: true } },
        { path: 'profile', name: 'Profile', component: () => import('@/pages/profile/index.vue'), meta: { title: '我的', tabbar: true, requiresAuth: true } },

        // ========== 二级页面（无底部导航） ==========
        { path: 'login', name: 'Login', component: () => import('@/pages/login/index.vue'), meta: { title: '登录' } },
        { path: 'register', name: 'Register', component: () => import('@/pages/register/index.vue'), meta: { title: '注册' } },
        { path: 'search', name: 'Search', component: () => import('@/pages/search/index.vue'), meta: { title: '搜索' } },
        { path: 'product/:id', name: 'ProductDetail', component: () => import('@/pages/product/detail.vue'), meta: { title: '商品详情' } },
        { path: 'checkout', name: 'Checkout', component: () => import('@/pages/checkout/index.vue'), meta: { title: '确认订单', requiresAuth: true } },
        { path: 'orders', name: 'OrderList', component: () => import('@/pages/order/list.vue'), meta: { title: '我的订单', requiresAuth: true } },
        { path: 'order/:id', name: 'OrderDetail', component: () => import('@/pages/order/detail.vue'), meta: { title: '订单详情', requiresAuth: true } },
        { path: 'address', name: 'AddressList', component: () => import('@/pages/address/list.vue'), meta: { title: '地址管理', requiresAuth: true } },
        { path: 'address/edit/:id?', name: 'AddressEdit', component: () => import('@/pages/address/edit.vue'), meta: { title: '编辑地址', requiresAuth: true } },
        { path: 'favorite', name: 'Favorite', component: () => import('@/pages/favorite/index.vue'), meta: { title: '我的收藏', requiresAuth: true } },
        { path: 'profile/edit', name: 'ProfileEdit', component: () => import('@/pages/profile/edit.vue'), meta: { title: '编辑资料', requiresAuth: true } },
        { path: 'profile/detail', name: 'ProfileDetail', component: () => import('@/pages/profile/detail.vue'), meta: { title: '个人信息', requiresAuth: true } },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '商城'

  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
