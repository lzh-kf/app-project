import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'

// Auth
import { register, login, getMe, updateProfile } from '../controllers/auth'

// Home
import { getHomeData } from '../controllers/home'

// Banners
import { getBanners } from '../controllers/banners'

// Categories
import { getCategoryTree, getCategoryList } from '../controllers/categories'

// Products
import { getProducts, getFeaturedProducts, getProductDetail } from '../controllers/products'

// Cart
import { getCart, addToCart, updateCartItem, removeCartItem, toggleSelect } from '../controllers/cart'

// Addresses
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addresses'

// Orders
import { createOrder, getOrders, getOrderDetail, cancelOrder, confirmReceive } from '../controllers/orders'

// Favorites
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favorites'

const router = Router()

// ========== Auth（无需认证） ==========
router.post('/auth/register', register)
router.post('/auth/login', login)

// ========== Auth（需认证） ==========
router.get('/auth/me', authMiddleware, getMe)
router.put('/auth/profile', authMiddleware, updateProfile)

// ========== Home（无需认证） ==========
router.get('/home', getHomeData)

// ========== Banners（无需认证） ==========
router.get('/banners', getBanners)

// ========== Categories（无需认证） ==========
router.get('/categories/tree', getCategoryTree)
router.get('/categories/list', getCategoryList)

// ========== Products（无需认证） ==========
router.get('/products', getProducts)
router.get('/products/featured', getFeaturedProducts)
router.get('/products/:id', getProductDetail)

// ========== Cart（需认证） ==========
router.get('/cart', authMiddleware, getCart)
router.post('/cart', authMiddleware, addToCart)
router.put('/cart/select', authMiddleware, toggleSelect)
router.put('/cart/:id', authMiddleware, updateCartItem)
router.delete('/cart/:id', authMiddleware, removeCartItem)

// ========== Addresses（需认证） ==========
router.get('/addresses', authMiddleware, getAddresses)
router.post('/addresses', authMiddleware, createAddress)
router.put('/addresses/:id/default', authMiddleware, setDefaultAddress)
router.put('/addresses/:id', authMiddleware, updateAddress)
router.delete('/addresses/:id', authMiddleware, deleteAddress)

// ========== Orders（需认证） ==========
router.post('/orders', authMiddleware, createOrder)
router.get('/orders', authMiddleware, getOrders)
router.get('/orders/:id', authMiddleware, getOrderDetail)
router.put('/orders/:id/cancel', authMiddleware, cancelOrder)
router.put('/orders/:id/confirm', authMiddleware, confirmReceive)

// ========== Favorites（需认证） ==========
router.get('/favorites', authMiddleware, getFavorites)
router.post('/favorites', authMiddleware, addFavorite)
router.delete('/favorites/:productId', authMiddleware, removeFavorite)

export default router
