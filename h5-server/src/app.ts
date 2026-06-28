import express from 'express'
import cors from 'cors'
import path from 'path'
import memberRoutes from './routes/index'

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// C端 API 路由
app.use('/api/member', memberRoutes)

// 健康检查
app.get('/api/member/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { timestamp: new Date().toISOString() } })
})

// 生产环境托管前端静态文件
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../h5-client/dist')
  app.use(express.static(clientDist))

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// 全局错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    code: -1,
    message: err.message || '服务器内部错误',
    data: null,
  })
})

export default app
