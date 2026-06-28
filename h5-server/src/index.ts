import app from './app'
import { config } from './config'

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[h5-server] C端商城服务已启动: http://0.0.0.0:${config.port}`)
  console.log(`[h5-server] API 前缀: /api/member`)
})
