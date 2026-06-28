/**
 * 数据迁移脚本：更新已有商品的 description 字段为富文本 HTML
 *
 * 使用方式：
 *   npx tsx prisma/migrate-product-descriptions.ts
 *
 * 安全特性：
 *   - 只更新 description 字段，不动其他数据
 *   - 空运行模式（--dry）先预览不写入
 *   - 可指定单个商品（--id=123）测试效果
 */

import { prisma } from '../src/utils/prisma'

// ====== 随机工具函数 ======
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2) {
  const v = Math.random() * (max - min) + min
  return Number(v.toFixed(decimals))
}

// ====== 商品名称词组库（与 seed.ts 保持一致） ======
const BRANDS = ['小米', '华为', '三星', '索尼', '联想', '戴尔', '惠普', '美的', '格力', '海尔', '飞利浦', '松下', '九阳', '苏泊尔', '科沃斯', '戴森', '苹果', 'OPPO', 'vivo', '荣耀', '华硕', '微星', '罗技', '雷蛇', '漫步者', '安踏', '李宁', '特步', '361°', '鸿星尔克', '优衣库', '海澜之家', '欧莱雅', '兰蔻', '雅诗兰黛', '资生堂', '花王', '帮宝适', '三只松鼠', '良品铺子', '百草味', '伊利', '蒙牛', '德芙', '费列罗', '康师傅', '统一', '立白', '蓝月亮', '威猛先生', '南极人', '恒源祥', '水星家纺', '罗莱', '欧普', '公牛', '三棵树', '多乐士', '探路者', '骆驼', '迪卡侬', '永久', '凤凰', '捷安特', '美利达', '得力', '晨光', '英雄', '施耐德', '正泰', '三一', '徐工', '周大福', '老凤祥', '施华洛世奇', '卡西欧', '斯沃琪']

const ADJECTIVES = ['升级款', '旗舰款', '经典款', '轻奢', '简约', '时尚', '复古', '创意', '便携', '多功能', '静音', '高效', '节能', '智能', '高清', '超清', '大容量', '迷你', '折叠', '防水', '防摔', '抗菌', '除螨', '速干', '保暖', '透气']

const UNITS = ['个', '件', '套', '台', '只', '条', '双', '瓶', '盒', '袋', '箱', '本', '支', '副', '张', '把']

// ====== 从商品名反推参数 ======
function parseProductName(name: string): { brand: string; adj: string; baseName: string } {
  // name 格式: "小米 升级款 智能手机 Pro 42"
  const parts = name.split(' ')

  // 查找品牌
  let brand = '品牌'
  for (const b of BRANDS) {
    if (name.startsWith(b)) {
      brand = b
      break
    }
  }

  // 查找形容词
  let adj = '经典款'
  for (const a of ADJECTIVES) {
    if (parts.includes(a)) {
      adj = a
      break
    }
  }

  // baseName: 取品牌和形容词之后、型号之前的词
  const brandIdx = parts.indexOf(brand)
  const adjIdx = parts.indexOf(adj)
  const startIdx = Math.max(
    brandIdx >= 0 ? brandIdx + 1 : 0,
    adjIdx >= 0 ? adjIdx + 1 : 0,
  )
  // 去掉最后的型号词（常见的如 Pro, Max, Mini 等）
  const modelWords = ['Pro', 'Max', 'Plus', 'Air', 'Mini', 'SE', 'Ultra', 'Lite', 'X', 'S']
  const middleParts = parts.slice(startIdx).filter(p => !modelWords.includes(p) && !/^\d+$/.test(p))
  const baseName = middleParts.length > 0 ? middleParts.join('') : '商品'

  return { brand, adj, baseName }
}

// ====== 富文本描述生成器（与 seed.ts 保持一致） ======
function generateRichDescription(brand: string, adj: string, baseName: string, unit: string, seed: number): string {
  const featurePools = [
    [`极致性价比：${brand}官方直营，省去中间环节，把实惠直接给到您`, `精湛工艺：严格品控体系，每一${unit}都经过多重检测`, `无忧售后：7天无理由退换，30天质量问题包换，1年保修`, `快速发货：全国多仓直发，下单后24小时内出库`, `正品保障：${brand}官方授权，100%正品承诺`],
    [`${adj}设计语言：由国际设计团队倾力打造，颜值与实用兼具`, `优质材质：严选环保原材料，通过SGS检测认证，安全放心`, `智能体验：搭载最新智能芯片，操作流畅，响应迅速`, `持久耐用：经实验室5000+次耐久测试，品质如一`, `场景百搭：无论是居家还是办公，都能完美融入`],
    [`核心科技：${brand}自主研发专利技术，行业领先水平`, `人性化设计：符合人体工学，使用舒适不累`, `节能环保：一级能效标准，低碳生活从选择开始`, `静音运行：噪音低至35dB，不打扰您的生活`, `轻巧便携：紧凑机身设计，轻松收纳不占空间`],
    [`甄选品质：${brand}坚持只做精品，宁缺毋滥`, `爆款口碑：全网累计销量突破百万，好评率98%+`, `创新功能：突破传统设计，重新定义${baseName}`, `安全防护：多重安全保护机制，使用更安心`, `超长续航：大容量电池+智能省电技术，告别频繁充电`],
  ]

  const pool = featurePools[seed % featurePools.length]

  const specTemplates = [
    `<table><tr><th>参数项</th><th>规格</th></tr><tr><td>品牌</td><td>${brand}</td></tr><tr><td>型号</td><td>${adj}${baseName}</td></tr><tr><td>材质</td><td>ABS+PC环保复合材料</td></tr><tr><td>颜色</td><td>经典黑 / 简约白 / 深空灰</td></tr><tr><td>尺寸</td><td>${rand(10, 45)}×${rand(8, 30)}×${rand(2, 15)}cm</td></tr><tr><td>净重</td><td>${randFloat(0.1, 5.0, 1)}kg</td></tr><tr><td>产地</td><td>中国大陆</td></tr></table>`,
    `<table><tr><th>规格</th><th>详情</th></tr><tr><td>品牌</td><td>${brand}</td></tr><tr><td>系列</td><td>${adj}系列 ${seed % 10 + 1}代</td></tr><tr><td>材质工艺</td><td>航空级铝合金 / 一体成型</td></tr><tr><td>配色方案</td><td>曜石黑 / 珍珠白 / 星空蓝</td></tr><tr><td>包装尺寸</td><td>${rand(20, 50)}×${rand(15, 35)}×${rand(5, 20)}cm</td></tr><tr><td>毛重</td><td>约${randFloat(0.5, 6.0, 1)}kg</td></tr><tr><td>执行标准</td><td>GB/T ${rand(10000, 99999)}-2024</td></tr></table>`,
    `<table><tr><th>技术参数</th><th>指标</th></tr><tr><td>品牌</td><td>${brand}</td></tr><tr><td>产品型号</td><td>${brand}-${adj}-${seed % 1000}</td></tr><tr><td>外壳材质</td><td>高品质工程塑料 / 防刮花涂层</td></tr><tr><td>可选颜色</td><td>深邃黑 / 皓月白 / 雾霾蓝 / 樱花粉</td></tr><tr><td>外形尺寸</td><td>约${rand(5, 40)}×${rand(5, 30)}×${rand(1, 18)}cm</td></tr><tr><td>产品净重</td><td>${randFloat(0.05, 4.0, 1)}kg</td></tr><tr><td>保修期限</td><td>全国联保 ${[1, 2, 3][seed % 3]} 年</td></tr></table>`,
  ]

  const specTable = specTemplates[seed % specTemplates.length]

  const shuffled = [...pool].sort(() => (seed * 7 + 3) % pool.length - 2)
  const highlights = shuffled.slice(0, 4).map(f => `<li>${f}</li>`).join('')

  const scenes = [
    '无论是居家生活、办公学习，还是户外旅行，这款产品都能成为您的得力助手。简约而不简单的外观设计，让它轻松融入各种环境。',
    `适用于日常通勤、商务差旅、休闲聚会等多种场合。一${unit}多用，满足您不同场景下的需求，让生活更加便捷高效。`,
    '无论是送给亲朋好友作为礼物，还是犒劳自己的辛苦付出，都是非常不错的选择。精美大气的包装，彰显您的品味与心意。',
    '从清晨的第一缕阳光到深夜的静谧时光，它都能陪伴在您身边，让每一天都充满品质感与幸福感。',
  ]

  const imgSeed1 = seed * 3 + 1
  const imgSeed2 = seed * 3 + 2

  return `
<div style="margin-bottom:16px;">
  <p style="font-size:15px;color:#333;line-height:1.9;margin-bottom:12px;">
    <strong>${brand}</strong> 全新推出的<strong>${adj}${baseName}</strong>，凝聚了品牌多年技术沉淀与设计理念。
    本款产品主打<strong>${adj}</strong>风格，在功能性、美观性和耐用性之间达到了出色的平衡。
    ${brand}一直以来坚持"品质为先"的原则，每一${unit}产品都经过严格的质量把控，
    只为给用户带来超越期待的使用体验。
  </p>

  <p style="font-size:14px;color:#555;line-height:1.9;margin-bottom:12px;">
    在原材料选择上，${brand}坚持使用高品质环保材料，从源头保障产品品质。
    生产工艺方面，采用行业领先的自动化生产线，配合多重人工质检环节，
    确保每一${unit}出厂的产品都经得起时间的考验。
  </p>

  <img src="https://picsum.photos/seed/desc${imgSeed1}/750/400" alt="${brand}${baseName}" style="width:100%;border-radius:8px;margin:12px 0;" />

  <h3 style="font-size:16px;color:#333;margin:16px 0 8px;padding-left:8px;border-left:3px solid #ee0a24;">✨ 产品亮点</h3>
  <ul style="font-size:14px;color:#555;line-height:2;padding-left:20px;margin:8px 0 16px;">
    ${highlights}
  </ul>

  <h3 style="font-size:16px;color:#333;margin:16px 0 8px;padding-left:8px;border-left:3px solid #ee0a24;">📋 规格参数</h3>
  ${specTable}

  <img src="https://picsum.photos/seed/desc${imgSeed2}/750/400" alt="${brand}${baseName}实拍" style="width:100%;border-radius:8px;margin:12px 0;" />

  <h3 style="font-size:16px;color:#333;margin:16px 0 8px;padding-left:8px;border-left:3px solid #ee0a24;">🎯 适用场景</h3>
  <p style="font-size:14px;color:#555;line-height:1.9;margin-bottom:8px;">
    ${scenes[seed % scenes.length]}
  </p>

  <p style="font-size:14px;color:#999;line-height:1.9;margin-top:16px;padding:12px;background:#fafafa;border-radius:6px;">
    <strong>📦 包装清单：</strong>${baseName}${unit} ×1、说明书 ×1、保修卡 ×1、精美包装盒 ×1
    ${seed % 3 === 0 ? '、赠品配件包 ×1' : seed % 3 === 1 ? '、收纳袋 ×1' : '、清洁布 ×1'}
  </p>
</div>
`.trim()
}

// ====== 主迁移逻辑 ======
async function migrate() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry')
  const idArg = args.find(a => a.startsWith('--id='))
  const targetId = idArg ? parseInt(idArg.split('=')[1]) : null

  if (dryRun) {
    console.log('🔍 空运行模式（--dry）：只预览，不写入数据库\n')
  }

  // 查询商品
  const where = targetId ? { id: targetId } : {}
  const totalCount = await prisma.product.count({ where })
  console.log(`📦 找到 ${totalCount} 个商品\n`)

  if (totalCount === 0) {
    console.log('没有需要处理的商品，退出')
    return
  }

  // 分批处理
  const BATCH = 200
  let updated = 0
  let skipped = 0

  for (let offset = 0; offset < totalCount; offset += BATCH) {
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      skip: offset,
      take: BATCH,
    })

    for (const p of products) {
      // 从 name 反推参数
      const { brand, adj, baseName } = parseProductName(p.name)

      // 用 product.id 作为 seed，保证每个商品有独特但确定性的描述
      const seed = (p.id % 200) + 1
      const unit = UNITS[p.id % UNITS.length]

      const newDesc = generateRichDescription(brand, adj, baseName, unit, seed)

      if (dryRun) {
        // 预览模式：打印前 3 条
        if (updated < 3) {
          console.log(`--- 商品 #${p.id}: ${p.name} ---`)
          console.log(`  品牌: ${brand}  形容词: ${adj}  品名: ${baseName}  单位: ${unit}`)
          console.log(`  旧描述: ${p.description?.substring(0, 80)}...`)
          console.log(`  新描述: ${newDesc.substring(0, 120)}...\n`)
        }
        updated++
      } else {
        // 真实写入
        await prisma.product.update({
          where: { id: p.id },
          data: { description: newDesc },
        })
        updated++
      }
    }

    const progress = Math.min(offset + BATCH, totalCount)
    console.log(`  ... 已处理 ${progress}/${totalCount}`)
  }

  if (dryRun) {
    console.log(`\n🔍 空运行完成！共 ${updated} 个商品将被更新`)
    console.log('   确认无误后，去掉 --dry 参数执行真实写入：')
    console.log('   npx tsx prisma/migrate-product-descriptions.ts')
  } else {
    console.log(`\n✅ 迁移完成！共更新 ${updated} 条商品描述，跳过 ${skipped} 条`)
  }
}

migrate()
  .catch(e => {
    console.error('❌ 迁移失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
