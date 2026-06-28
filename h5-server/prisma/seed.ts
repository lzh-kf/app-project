import { prisma } from '../src/utils/prisma'
import bcrypt from 'bcryptjs'

// ====== 随机工具函数 ======
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2) {
  const v = Math.random() * (max - min) + min
  return Number(v.toFixed(decimals))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ====== 分类数据结构 ======
interface CategoryDef {
  name: string
  description: string
  subs: string[]
}

const CATEGORY_DEFS: CategoryDef[] = [
  { name: '手机通讯', description: '手机、手机配件、通话设备', subs: ['智能手机', '手机壳膜', '充电器数据线', '蓝牙耳机', '手机支架'] },
  { name: '电脑办公', description: '电脑整机、外设、办公用品', subs: ['笔记本电脑', '显示器', '键盘鼠标', '办公耗材'] },
  { name: '家用电器', description: '大家电、小家电、厨房电器', subs: ['空调洗衣机', '冰箱冷柜', '厨房电器', '生活电器'] },
  { name: '男装', description: '男士服饰、商务休闲', subs: ['T恤衬衫', '裤装', '夹克外套', '西装正装'] },
  { name: '女装', description: '女士服饰、时尚潮流', subs: ['连衣裙', '上衣针织', '裤装半身裙', '外套风衣'] },
  { name: '鞋靴箱包', description: '男女鞋靴、箱包皮具', subs: ['运动鞋', '休闲鞋皮鞋', '双肩包', '拉杆箱'] },
  { name: '美妆护肤', description: '化妆品、护肤品、个人护理', subs: ['面部护肤', '彩妆', '香水香氛', '身体护理'] },
  { name: '母婴用品', description: '奶粉辅食、纸尿裤、玩具', subs: ['奶粉辅食', '纸尿裤湿巾', '益智玩具', '婴童服饰'] },
  { name: '食品生鲜', description: '零食饮品、生鲜蔬果、粮油', subs: ['休闲零食', '坚果蜜饯', '饮料冲调', '生鲜水果', '粮油调味'] },
  { name: '家居家装', description: '家具、家纺、灯具、收纳', subs: ['客厅家具', '卧室家纺', '灯具照明', '收纳日用'] },
  { name: '运动户外', description: '健身器材、户外装备、骑行', subs: ['健身器材', '运动服饰', '户外露营', '骑行装备'] },
  { name: '图书文娱', description: '图书、教材、文具乐器', subs: ['小说文学', '教辅考试', '少儿图书', '文具用品'] },
  { name: '汽车用品', description: '车载电器、内外饰、保养', subs: ['车载电器', '内外装饰', '维修保养', '安全自驾'] },
  { name: '医药健康', description: '保健品、医疗器械、滋补', subs: ['营养保健', '医疗器械', '传统滋补', '成人计生'] },
  { name: '珠宝饰品', description: '金银首饰、时尚饰品、手表', subs: ['黄金铂金', '银饰水晶', '潮流饰品', '腕表'] },
  { name: '宠物生活', description: '主粮零食、窝笼玩具、洗护', subs: ['猫粮狗粮', '宠物零食', '玩具出行', '洗护日用'] },
]

// ====== 商品名称词组库 ======
const BRANDS = ['小米', '华为', '三星', '索尼', '联想', '戴尔', '惠普', '美的', '格力', '海尔', '飞利浦', '松下', '九阳', '苏泊尔', '科沃斯', '戴森', '苹果', 'OPPO', 'vivo', '荣耀', '华硕', '微星', '罗技', '雷蛇', '漫步者', '安踏', '李宁', '特步', '361°', '鸿星尔克', '优衣库', '海澜之家', '欧莱雅', '兰蔻', '雅诗兰黛', '资生堂', '花王', '帮宝适', '三只松鼠', '良品铺子', '百草味', '伊利', '蒙牛', '德芙', '费列罗', '康师傅', '统一', '立白', '蓝月亮', '威猛先生', '南极人', '恒源祥', '水星家纺', '罗莱', '欧普', '公牛', '三棵树', '多乐士', '探路者', '骆驼', '迪卡侬', '永久', '凤凰', '捷安特', '美利达', '得力', '晨光', '英雄', '施耐德', '正泰', '三一', '徐工', '周大福', '老凤祥', '施华洛世奇', '卡西欧', '斯沃琪']

const ADJECTIVES = ['升级款', '旗舰款', '经典款', '轻奢', '简约', '时尚', '复古', '创意', '便携', '多功能', '静音', '高效', '节能', '智能', '高清', '超清', '大容量', '迷你', '折叠', '防水', '防摔', '抗菌', '除螨', '速干', '保暖', '透气']

const UNITS = ['个', '件', '套', '台', '只', '条', '双', '瓶', '盒', '袋', '箱', '本', '支', '副', '张', '把']

// ====== 商品描述生成器（富文本 HTML） ======
function generateRichDescription(brand: string, adj: string, baseName: string, unit: string, seed: number): string {
  // 亮点词库 — 轮换使用，让不同商品的描述有差异
  const featurePools = [
    [`极致性价比：${brand}官方直营，省去中间环节，把实惠直接给到您`, `精湛工艺：严格品控体系，每一${unit}都经过多重检测`, `无忧售后：7天无理由退换，30天质量问题包换，1年保修`, `快速发货：全国多仓直发，下单后24小时内出库`, `正品保障：${brand}官方授权，100%正品承诺`],
    [`${adj}设计语言：由国际设计团队倾力打造，颜值与实用兼具`, `优质材质：严选环保原材料，通过SGS检测认证，安全放心`, `智能体验：搭载最新智能芯片，操作流畅，响应迅速`, `持久耐用：经实验室5000+次耐久测试，品质如一`, `场景百搭：无论是居家还是办公，都能完美融入`],
    [`核心科技：${brand}自主研发专利技术，行业领先水平`, `人性化设计：符合人体工学，使用舒适不累`, `节能环保：一级能效标准，低碳生活从选择开始`, `静音运行：噪音低至35dB，不打扰您的生活`, `轻巧便携：紧凑机身设计，轻松收纳不占空间`],
    [`甄选品质：${brand}坚持只做精品，宁缺毋滥`, `爆款口碑：全网累计销量突破百万，好评率98%+`, `创新功能：突破传统设计，重新定义${baseName}`, `安全防护：多重安全保护机制，使用更安心`, `超长续航：大容量电池+智能省电技术，告别频繁充电`],
  ]

  const pool = featurePools[seed % featurePools.length]

  // 规格参数 — 不同 seed 生成不同表格
  const specTemplates = [
    `<table><tr><th>参数项</th><th>规格</th></tr><tr><td>品牌</td><td>${brand}</td></tr><tr><td>型号</td><td>${adj}${baseName}</td></tr><tr><td>材质</td><td>ABS+PC环保复合材料</td></tr><tr><td>颜色</td><td>经典黑 / 简约白 / 深空灰</td></tr><tr><td>尺寸</td><td>${rand(10, 45)}×${rand(8, 30)}×${rand(2, 15)}cm</td></tr><tr><td>净重</td><td>${randFloat(0.1, 5.0, 1)}kg</td></tr><tr><td>产地</td><td>中国大陆</td></tr></table>`,
    `<table><tr><th>规格</th><th>详情</th></tr><tr><td>品牌</td><td>${brand}</td></tr><tr><td>系列</td><td>${adj}系列 ${seed % 10 + 1}代</td></tr><tr><td>材质工艺</td><td>航空级铝合金 / 一体成型</td></tr><tr><td>配色方案</td><td>曜石黑 / 珍珠白 / 星空蓝</td></tr><tr><td>包装尺寸</td><td>${rand(20, 50)}×${rand(15, 35)}×${rand(5, 20)}cm</td></tr><tr><td>毛重</td><td>约${randFloat(0.5, 6.0, 1)}kg</td></tr><tr><td>执行标准</td><td>GB/T ${rand(10000, 99999)}-2024</td></tr></table>`,
    `<table><tr><th>技术参数</th><th>指标</th></tr><tr><td>品牌</td><td>${brand}</td></tr><tr><td>产品型号</td><td>${brand}-${adj}-${seed % 1000}</td></tr><tr><td>外壳材质</td><td>高品质工程塑料 / 防刮花涂层</td></tr><tr><td>可选颜色</td><td>深邃黑 / 皓月白 / 雾霾蓝 / 樱花粉</td></tr><tr><td>外形尺寸</td><td>约${rand(5, 40)}×${rand(5, 30)}×${rand(1, 18)}cm</td></tr><tr><td>产品净重</td><td>${randFloat(0.05, 4.0, 1)}kg</td></tr><tr><td>保修期限</td><td>全国联保 ${[1, 2, 3][seed % 3]} 年</td></tr></table>`,
  ]

  const specTable = specTemplates[seed % specTemplates.length]

  // 亮点列表（打乱顺序取前4条）
  const shuffled = [...pool].sort(() => (seed * 7 + 3) % pool.length - 2)
  const highlights = shuffled.slice(0, 4).map(f => `<li>${f}</li>`).join('')

  // 场景描述
  const scenes = [
    '无论是居家生活、办公学习，还是户外旅行，这款产品都能成为您的得力助手。简约而不简单的外观设计，让它轻松融入各种环境。',
    `适用于日常通勤、商务差旅、休闲聚会等多种场合。一${unit}多用，满足您不同场景下的需求，让生活更加便捷高效。`,
    '无论是送给亲朋好友作为礼物，还是犒劳自己的辛苦付出，都是非常不错的选择。精美大气的包装，彰显您的品味与心意。',
    '从清晨的第一缕阳光到深夜的静谧时光，它都能陪伴在您身边，让每一天都充满品质感与幸福感。',
  ]

  const imgSeed1 = seed * 3 + 1
  const imgSeed2 = seed * 3 + 2

  // 组装完整 HTML
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

// ====== 主函数 ======
async function main() {
  console.log('🌱 开始初始化种子数据...')
  console.time('⏱  总耗时')

  // =========== 1. 权限 ===========
  const permCount = await prisma.permission.count()
  if (permCount > 0) {
    console.log(`⏭️  权限已存在 (${permCount} 条)，跳过`)
  } else {
    const permData = [
      { name: '用户管理', code: 'user:menu', type: 'menu', path: '/users', icon: 'UserOutlined', sort: 1 },
      { name: '查看用户', code: 'user:view', type: 'button', parentCode: 'user:menu', sort: 1 },
      { name: '创建用户', code: 'user:create', type: 'button', parentCode: 'user:menu', sort: 2 },
      { name: '编辑用户', code: 'user:update', type: 'button', parentCode: 'user:menu', sort: 3 },
      { name: '删除用户', code: 'user:delete', type: 'button', parentCode: 'user:menu', sort: 4 },
      { name: '分配角色', code: 'user:assign-role', type: 'button', parentCode: 'user:menu', sort: 5 },
      { name: '角色管理', code: 'role:menu', type: 'menu', path: '/roles', icon: 'TeamOutlined', sort: 2 },
      { name: '查看角色', code: 'role:view', type: 'button', parentCode: 'role:menu', sort: 1 },
      { name: '创建角色', code: 'role:create', type: 'button', parentCode: 'role:menu', sort: 2 },
      { name: '编辑角色', code: 'role:update', type: 'button', parentCode: 'role:menu', sort: 3 },
      { name: '删除角色', code: 'role:delete', type: 'button', parentCode: 'role:menu', sort: 4 },
      { name: '分配权限', code: 'role:assign-perm', type: 'button', parentCode: 'role:menu', sort: 5 },
      { name: '权限管理', code: 'perm:menu', type: 'menu', path: '/permissions', icon: 'SafetyOutlined', sort: 3 },
      { name: '查看权限', code: 'perm:view', type: 'button', parentCode: 'perm:menu', sort: 1 },
      { name: '创建权限', code: 'perm:create', type: 'button', parentCode: 'perm:menu', sort: 2 },
      { name: '编辑权限', code: 'perm:update', type: 'button', parentCode: 'perm:menu', sort: 3 },
      { name: '删除权限', code: 'perm:delete', type: 'button', parentCode: 'perm:menu', sort: 4 },
      { name: '商品管理', code: 'product:menu', type: 'menu', path: '/products', icon: 'ShoppingOutlined', sort: 4 },
      { name: '查看商品', code: 'product:view', type: 'button', parentCode: 'product:menu', sort: 1 },
      { name: '创建商品', code: 'product:create', type: 'button', parentCode: 'product:menu', sort: 2 },
      { name: '编辑商品', code: 'product:update', type: 'button', parentCode: 'product:menu', sort: 3 },
      { name: '删除商品', code: 'product:delete', type: 'button', parentCode: 'product:menu', sort: 4 },
      { name: '分类管理', code: 'category:menu', type: 'menu', path: '/categories', icon: 'AppstoreOutlined', sort: 5 },
      { name: '查看分类', code: 'category:view', type: 'button', parentCode: 'category:menu', sort: 1 },
      { name: '创建分类', code: 'category:create', type: 'button', parentCode: 'category:menu', sort: 2 },
      { name: '编辑分类', code: 'category:update', type: 'button', parentCode: 'category:menu', sort: 3 },
      { name: '删除分类', code: 'category:delete', type: 'button', parentCode: 'category:menu', sort: 4 },
      { name: '订单管理', code: 'order:menu', type: 'menu', path: '/orders', icon: 'ShoppingCartOutlined', sort: 6 },
      { name: '查看订单', code: 'order:view', type: 'button', parentCode: 'order:menu', sort: 1 },
      { name: '处理订单', code: 'order:update', type: 'button', parentCode: 'order:menu', sort: 2 },
    ]

    const permMap: Record<string, number> = {}
    const parentPerms = permData.filter(p => !p.parentCode)
    const childPerms = permData.filter(p => p.parentCode)

    for (const p of parentPerms) {
      const { parentCode, ...data } = p
      const created = await prisma.permission.upsert({
        where: { code: data.code },
        update: data,
        create: data,
      })
      permMap[data.code] = created.id
    }

    for (const p of childPerms) {
      const { parentCode, ...rest } = p
      const parentId = permMap[parentCode!]
      const data = { ...rest, parentId }
      const created = await prisma.permission.upsert({
        where: { code: data.code },
        update: data,
        create: data,
      })
      permMap[data.code] = created.id
    }
    console.log(`✅ 权限: ${Object.keys(permMap).length} 条`)
  }

  // =========== 2. 角色 ===========
  const roleCount = await prisma.role.count()
  let adminRole: { id: number; code: string }
  let editorRole: { id: number; code: string }
  let viewerRole: { id: number; code: string }

  if (roleCount > 0) {
    console.log(`⏭️  角色已存在 (${roleCount} 条)，跳过`)
    // 仍需要查询已有角色供后续关联使用
    const roles = await prisma.role.findMany()
    adminRole = roles.find(r => r.code === 'admin')!
    editorRole = roles.find(r => r.code === 'editor')!
    viewerRole = roles.find(r => r.code === 'viewer')!
  } else {
    adminRole = await prisma.role.upsert({
      where: { code: 'admin' },
      update: { name: '超级管理员', description: '拥有所有权限' },
      create: { name: '超级管理员', code: 'admin', description: '拥有所有权限' },
    })
    editorRole = await prisma.role.upsert({
      where: { code: 'editor' },
      update: { name: '编辑者', description: '可查看和编辑，不可删除' },
      create: { name: '编辑者', code: 'editor', description: '可查看和编辑，不可删除' },
    })
    viewerRole = await prisma.role.upsert({
      where: { code: 'viewer' },
      update: { name: '只读用户', description: '仅可查看' },
      create: { name: '只读用户', code: 'viewer', description: '仅可查看' },
    })
    console.log('✅ 角色: 3 条')
  }

  // =========== 3. 角色-权限关联（仅首次创建时写入） ===========
  const rpCount = await prisma.rolePermission.count()
  if (rpCount > 0) {
    console.log(`⏭️  角色-权限关联已存在 (${rpCount} 条)，跳过`)
  } else {
    // 重新查询权限 map（可能因跳过而从数据库取）
    const allPerms = await prisma.permission.findMany()
    const permMap: Record<string, number> = {}
    for (const p of allPerms) permMap[p.code] = p.id

    const allPermIds = Object.values(permMap)
    await prisma.rolePermission.createMany({
      data: allPermIds.map(permissionId => ({ roleId: adminRole.id, permissionId })),
    })

    const editorPermCodes = [
      'user:menu', 'user:view', 'user:create', 'user:update', 'user:assign-role',
      'role:menu', 'role:view', 'role:create', 'role:update', 'role:assign-perm',
      'perm:menu', 'perm:view',
      'product:menu', 'product:view', 'product:create', 'product:update',
      'category:menu', 'category:view', 'category:create', 'category:update',
      'order:menu', 'order:view', 'order:update',
    ]
    await prisma.rolePermission.createMany({
      data: editorPermCodes.map(c => permMap[c]).filter(Boolean).map(permissionId => ({ roleId: editorRole.id, permissionId })),
    })

    const viewerPermCodes = [
      'user:menu', 'user:view', 'role:menu', 'role:view', 'perm:menu', 'perm:view',
      'product:menu', 'product:view', 'category:menu', 'category:view', 'order:menu', 'order:view',
    ]
    await prisma.rolePermission.createMany({
      data: viewerPermCodes.map(c => permMap[c]).filter(Boolean).map(permissionId => ({ roleId: viewerRole.id, permissionId })),
    })
    console.log('✅ 角色-权限关联')
  }

  // =========== 4. 管理员用户 ===========
  let adminUser: { id: number; username: string }
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log(`⏭️  用户已存在 (${userCount} 条)，跳过`)
    const u = await prisma.user.findUnique({ where: { username: 'admin' } })
    adminUser = u ?? (await prisma.user.findFirst())!
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: { username: 'admin', password: hashedPassword, email: 'admin@example.com' },
    })
    const existingUR = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    })
    if (!existingUR) {
      await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } })
    }
    console.log('✅ 管理员: admin / admin123')
  }

  // =========== 5. 商品分类 ===========
  console.log('📂 正在处理商品分类...')

  const existingCats = await prisma.category.count()
  if (existingCats > 0) {
    console.log(`⏭️  分类已存在 (${existingCats} 条)，跳过`)
  } else {
    // 创建一级分类
    const mainCatData = CATEGORY_DEFS.map((c, i) => ({
      name: c.name,
      description: c.description,
      sort: i + 1,
    }))
    await prisma.category.createMany({ data: mainCatData })

    // 查出所有一级分类
    const mainCats = await prisma.category.findMany({ where: { parentId: null } })
    const catMap: Record<string, number> = {}
    for (const mc of mainCats) {
      catMap[mc.name] = mc.id
    }

    // 创建二级分类
    const subCatData: { name: string; description: string; parentId: number; sort: number }[] = []
    for (const def of CATEGORY_DEFS) {
      const parentId = catMap[def.name]
      def.subs.forEach((sub, si) => {
        subCatData.push({ name: sub, description: `${def.name}-${sub}`, parentId, sort: si + 1 })
      })
    }
    // 分批插入
    const BATCH = 500
    for (let i = 0; i < subCatData.length; i += BATCH) {
      await prisma.category.createMany({ data: subCatData.slice(i, i + BATCH) })
    }
  }

  // 始终查询叶子分类（商品需挂到子分类上）
  const allCats = await prisma.category.findMany()
  const leafCats = allCats.filter(c => c.parentId !== null)
  console.log(`✅ 分类: 共 ${allCats.length} 条 (其中 ${leafCats.length} 个子分类)`)

  // =========== 6. 商品 ===========
  console.log('📦 正在处理商品...')

  const existingProducts = await prisma.product.count()
  if (existingProducts > 0) {
    console.log(`⏭️  商品已存在 (${existingProducts} 条)，跳过`)
  } else {
    const PRODUCT_COUNT = 1080
    const productData: {
      name: string
      description: string | null
      price: number
      originalPrice: number | null
      stock: number
      categoryId: number
      images: string
      status: number
      isFeatured: number
    }[] = []

    const usedNames = new Set<string>()

    for (let i = 0; i < PRODUCT_COUNT; i++) {
      const cat = leafCats[i % leafCats.length] // 轮询分配子分类
      const brand = BRANDS[i % BRANDS.length]
      const adj = pick(ADJECTIVES)
      const baseName = cat.name.replace(/[男女]/, '') // 去掉性别前缀避免重复
      const unit = pick(UNITS)

      // 生成唯一名称
      let name = ''
      let tries = 0
      do {
        const suffix = tries > 0 ? ` ${rand(1, 99)}` : ''
        const models = ['Pro', 'Max', 'Plus', 'Air', 'Mini', 'SE', 'Ultra', 'Lite', 'X', 'S']
        const model = pick(models)
        name = `${brand} ${adj} ${baseName} ${model}${suffix}`
        tries++
      } while (usedNames.has(name) && tries < 100)
      usedNames.add(name)

      const price = randFloat(9.9, 5999)
      const hasOrig = Math.random() > 0.3
      const originalPrice = hasOrig ? randFloat(price * 1.2, price * 2.5) : null
      const stock = rand(5, 5000)
      const seed = (i % 200) + 1

      productData.push({
        name,
        description: generateRichDescription(brand, adj, baseName, unit, seed),
        price,
        originalPrice,
        stock,
        categoryId: cat.id,
        images: JSON.stringify([
          `https://picsum.photos/seed/p${seed}a/400/400`,
          `https://picsum.photos/seed/p${seed}b/400/400`,
          `https://picsum.photos/seed/p${seed}c/400/400`,
        ]),
        status: Math.random() > 0.05 ? 1 : 0,   // 95% 上架
        isFeatured: Math.random() > 0.85 ? 1 : 0, // 15% 精选
      })

      if ((i + 1) % 200 === 0) console.log(`  ... 已生成 ${i + 1} 个商品`)
    }

    // 分批写入
    console.log('  ... 正在写入数据库...')
    const BATCH = 500
    for (let i = 0; i < productData.length; i += BATCH) {
      await prisma.product.createMany({ data: productData.slice(i, i + BATCH) })
    }
    console.log(`✅ 商品: ${PRODUCT_COUNT} 条`)
  }

  // =========== 7. Banner ===========
  const bannerCount = await prisma.banner.count()
  if (bannerCount > 0) {
    console.log(`⏭️  Banner 已存在 (${bannerCount} 条)，跳过`)
  } else {
    console.log('🖼️  正在初始化 Banner...')
    await prisma.banner.createMany({
      data: [
        { title: '618年中大促', image: 'https://picsum.photos/seed/banner1/750/350', link: '/pages/list/list', sort: 1 },
        { title: '新品首发 限时特惠', image: 'https://picsum.photos/seed/banner2/750/350', link: '/pages/list/list', sort: 2 },
        { title: '数码好物 低至5折', image: 'https://picsum.photos/seed/banner3/750/350', link: '/pages/list/list', sort: 3 },
      ],
    })
    console.log('✅ Banner: 3 条')
  }

  console.timeEnd('⏱  总耗时')
  console.log('🎉 种子数据初始化完成!')
}

main()
  .catch(e => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
