import * as bcrypt from 'bcrypt'
import {
  PrismaClient,
  UserStatus,
  HTTPMethod,
  StaffPosition,
  ReservationStatus,
  Channel,
  Prisma,
} from '../src/generated/prisma/client'
import envConfig from '../src/shared/config'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = envConfig.DATABASE_URL
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  // =================================================================================================
  // CLEANUP DATA
  // =================================================================================================
  console.log('Cleaning up old data...')
  try {
    // await prisma.cartItem.deleteMany({})
    // await prisma.userInteraction.deleteMany({})
    // await prisma.review.deleteMany({})
    // await prisma.inventoryDish.deleteMany({})
    // await prisma.inventoryTransaction.deleteMany({})
    // await prisma.inventory.deleteMany({})

    // await prisma.promotion.deleteMany({})

    // Dishes & SKUs
    // await prisma.sKU.deleteMany({})
    // await prisma.variantOption.deleteMany({})
    // await prisma.variant.deleteMany({})
    await prisma.dishTranslation.deleteMany({})
    await prisma.dish.deleteMany({})

    // Categories
    // await prisma.dishCategoryTranslation.deleteMany({})
    // await prisma.dishCategory.deleteMany({})

    // Restaurant & Tables
    // await prisma.restaurantStaff.deleteMany({})
    // await prisma.restaurantTable.deleteMany({})
    // await prisma.restaurant.deleteMany({})

    // Suppliers
    // await prisma.supplierTranslation.deleteMany({})
    // await prisma.supplier.deleteMany({})

    console.log('✓ Old data cleaned')
  } catch (e) {
    console.warn('⚠️ Cleanup warning (non-fatal):', e)
  }

  // =================================================================================================
  // 1. LANGUAGES
  // =================================================================================================
  console.log('Creating languages...')
  const viLang = await prisma.language.upsert({
    where: { id: 'vi' },
    update: {},
    create: { id: 'vi', name: 'Tiếng Việt' },
  })
  const enLang = await prisma.language.upsert({
    where: { id: 'en' },
    update: {},
    create: { id: 'en', name: 'English' },
  })
  console.log('✓ Languages created')

  // =================================================================================================
  // 2. ROLES & PERMISSIONS
  // =================================================================================================
  console.log('Creating roles and permissions...')

  const permissionsData = [
    // Users Module
    { name: 'Manage Users', path: 'users.*', method: HTTPMethod.POST, module: 'Users' },
    { name: 'View Users', path: 'users.list', method: HTTPMethod.GET, module: 'Users' },
    { name: 'My Profile', path: 'profile.*', method: HTTPMethod.GET, module: 'Users' },

    // Catalog Module (Dishes, Categories)
    { name: 'Manage Dishes', path: 'dishes.*', method: HTTPMethod.POST, module: 'Catalog' },
    { name: 'View Dishes', path: 'dishes.list', method: HTTPMethod.GET, module: 'Catalog' },
    { name: 'Manage Categories', path: 'categories.*', method: HTTPMethod.POST, module: 'Catalog' },

    // Order Module
    { name: 'Manage Orders', path: 'orders.*', method: HTTPMethod.POST, module: 'Sales' },
    { name: 'View Orders', path: 'orders.list', method: HTTPMethod.GET, module: 'Sales' },
    { name: 'Create Order', path: 'orders.create', method: HTTPMethod.POST, module: 'Sales' },

    // Inventory Module
    { name: 'Manage Inventory', path: 'inventory.*', method: HTTPMethod.POST, module: 'Inventory' },
    { name: 'View Inventory', path: 'inventory.list', method: HTTPMethod.GET, module: 'Inventory' },

    // Report Module
    { name: 'View Reports', path: 'reports.*', method: HTTPMethod.GET, module: 'Reports' },
  ]

  // Persist Permissions
  const permissionMap = new Map<string, string>()
  for (const perm of permissionsData) {
    const p = await prisma.permission.upsert({
      where: { path_method: { path: perm.path, method: perm.method } },
      update: {},
      create: perm,
    })
    permissionMap.set(perm.path, p.id)
  }

  // Helper to get IDs for a list of paths (supports wildcards simple check for now)
  const getPermIds = (paths: string[]) => {
    const ids: string[] = []
    for (const [path, id] of permissionMap.entries()) {
      // Simple logic: if path starts with one of the requested paths (e.g. 'orders.*' matches 'orders.create' if we had granular)
      // For now, we match exact paths from our definition above.
      if (
        paths.some((p) => p === path || (p.endsWith('.*') && path.startsWith(p.replace('.*', ''))))
      ) {
        ids.push(id)
      }
    }
    return [...new Set(ids)].map((id) => ({ id }))
  }

  const allPermIds = Array.from(permissionMap.values()).map((id) => ({ id }))

  // --- ADMIN ROLE ---
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      permissions: { set: [], connect: allPermIds },
    },
    create: {
      name: 'ADMIN',
      description: 'Administrator role with full access',
      permissions: { connect: allPermIds },
    },
  })

  // --- MANAGER ROLE ---
  // Manager: Catalog, Inventory, Sales (Full), Reports, Users (View)
  const managerPerms = getPermIds([
    'dishes.*',
    'dishes.list',
    'categories.*',
    'orders.*',
    'orders.list',
    'orders.create',
    'inventory.*',
    'inventory.list',
    'reports.*',
    'users.list',
    'profile.*',
  ])

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: { permissions: { set: [], connect: managerPerms } },
    create: {
      name: 'MANAGER',
      description: 'Restaurant Manager',
      permissions: { connect: managerPerms },
    },
  })

  // --- STAFF ROLE ---
  // Staff: Sales (sử dụng * để quản lý đơn họ tạo, nhưng có thể hạn chế sau), View Catalog, Inventory List
  const staffPerms = getPermIds([
    'orders.*',
    'orders.list',
    'orders.create',
    'dishes.list',
    'inventory.list',
    'profile.*',
  ])

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: { permissions: { set: [], connect: staffPerms } },
    create: {
      name: 'STAFF',
      description: 'Staff role for employees',
      permissions: { connect: staffPerms },
    },
  })

  // --- CUSTOMER ROLE ---
  // Customer: View Dishes, Create Order (limited logic in code), Profile
  const customerPerms = getPermIds([
    'dishes.list',
    'orders.create', // Khách tạo đơn
    'orders.list', // Khách xem đơn của mình (logic filter ở service)
    'profile.*',
  ])

  await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: { permissions: { set: [], connect: customerPerms } },
    create: {
      name: 'CUSTOMER',
      description: 'Customer role',
      permissions: { connect: customerPerms },
    },
  })

  console.log('✓ Roles & Permissions created/updated')

  // =================================================================================================
  // 3. USERS
  // =================================================================================================
  console.log('Creating users...')
  const hashedPassword = await bcrypt.hash(envConfig.ADMIN_PASSWORD, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: envConfig.ADMIN_EMAIL },
    update: { roleId: adminRole.id },
    create: {
      email: envConfig.ADMIN_EMAIL,
      name: envConfig.ADMIN_NAME,
      phoneNumber: envConfig.ADMIN_PHONE_NUMBER,
      password: hashedPassword,
      roleId: adminRole.id,
      status: UserStatus.ACTIVE,
    },
  })

  const clientEmail = 'client@example.com'
  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {},
    create: {
      email: clientEmail,
      name: 'Nguyen Van A',
      phoneNumber: '0987654321',
      password: hashedPassword,
      roleId: (await prisma.role.findUniqueOrThrow({ where: { name: 'CUSTOMER' } })).id,
      status: UserStatus.ACTIVE,
    },
  })

  // Seed Addresses
  const existingAddresses = await prisma.userAddress.count({ where: { userId: clientUser.id } })
  if (existingAddresses === 0) {
    await prisma.userAddress.createMany({
      data: [
        {
          userId: clientUser.id,
          label: 'Nhà riêng',
          recipientName: 'Nguyen Van A',
          phoneNumber: '0987654321',
          address: '123 Đường Láng, Đống Đa, Hà Nội',
          isDefault: true,
        },
        {
          userId: clientUser.id,
          label: 'Công ty',
          recipientName: 'Nguyen Van A',
          phoneNumber: '0987654321',
          address: 'Tòa nhà Tech, Cầu Giấy, Hà Nội',
          isDefault: false,
        },
      ],
    })
    console.log('✓ User addresses created')
  }

  // Seed Preferences
  const existingPref = await prisma.userPreference.findFirst({ where: { userId: clientUser.id } })
  if (!existingPref) {
    await prisma.userPreference.create({
      data: {
        userId: clientUser.id,
        preferences: {
          allergies: ['Đậu phộng', 'Hải sản'],
          spicinessLevel: 2, // 0-3
          favoriteCuisines: ['Vietnamese', 'Japanese'],
        },
      },
    })
    console.log('✓ User preferences created')
  }

  const managerEmail = 'manager@example.com'
  await prisma.user.upsert({
    where: { email: managerEmail },
    update: { roleId: managerRole.id },
    create: {
      email: managerEmail,
      name: 'Tran Van Quan Ly',
      phoneNumber: '0912345678',
      password: hashedPassword,
      roleId: managerRole.id,
      status: UserStatus.ACTIVE,
    },
  })

  const staffEmail = 'staff@example.com'
  await prisma.user.upsert({
    where: { email: staffEmail },
    update: { roleId: staffRole.id },
    create: {
      email: staffEmail,
      name: 'Le Van Nhan Vien',
      phoneNumber: '0988888888',
      password: hashedPassword,
      roleId: staffRole.id,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✓ Users created')

  // =================================================================================================
  // 4. RESTAURANT & TABLES
  // =================================================================================================
  console.log('Creating restaurant data...')

  // Try to find existing restaurant first to avoid hard reset
  let restaurant = await prisma.restaurant.findFirst()

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Bamixo Food & Tea',
        address: 'Hoang Cong, Ha Dong, Hanoi',
        phone: '0363290475',
      },
    })
    console.log('✓ Restaurant created')
  } else {
    console.log(`✓ Using existing restaurant: ${restaurant.name}`)
  }

  // Seed Tables (T-01 to T-12 + VIP)
  const tableTargets = [
    ...Array.from({ length: 12 }, (_, i) => {
      const num = (i + 1).toString().padStart(2, '0')
      return {
        tableNumber: `T-${num}`,
        capacity: 4,
        qrCode: `QR-T${num}`,
      }
    }),
    { tableNumber: 'VIP-01', capacity: 10, qrCode: 'QR-VIP01' },
    { tableNumber: 'VIP-02', capacity: 10, qrCode: 'QR-VIP02' },
    { tableNumber: 'VIP-03', capacity: 10, qrCode: 'QR-VIP03' },
  ]

  for (const t of tableTargets) {
    // Check if table exists
    const existingTable = await prisma.restaurantTable.findFirst({
      where: {
        tableNumber: t.tableNumber,
        restaurantId: restaurant.id,
      },
    })

    if (existingTable) {
      console.log(`Skipped ${t.tableNumber} (Exists)`)
    } else {
      await prisma.restaurantTable.create({
        data: {
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          qrCode: t.qrCode,
          status: 'AVAILABLE',
          restaurantId: restaurant.id,
        },
      })
      console.log(`Created ${t.tableNumber}`)
    }
  }

  // Seed Restaurant Manager
  const existingManager = await prisma.restaurantStaff.findFirst({
    where: {
      userId: adminUser.id,
      restaurantId: restaurant.id,
    },
  })

  if (!existingManager) {
    await prisma.restaurantStaff.create({
      data: {
        restaurantId: restaurant.id,
        userId: adminUser.id,
        position: StaffPosition.MANAGER,
      },
    })
    console.log('✓ Restaurant Manager assigned')
  } else {
    console.log('✓ Restaurant Manager already assigned')
  }
  console.log('✓ Restaurant & Tables created/updated')

  // =================================================================================================
  // 5. SUPPLIERS
  // =================================================================================================
  console.log('Creating suppliers...')

  let supplier = await prisma.supplier.findFirst({
    where: { name: 'Bamicha Supplies' },
  })

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: 'Bamicha Supplies',
        contactName: 'Mr. Supplier',
        rating: 4.5,
        supplierTranslations: {
          create: [
            {
              languageId: viLang.id,
              name: 'Bamicha Supplies',
              description: 'Nhà cung cấp thực phẩm uy tín',
            },
            {
              languageId: enLang.id,
              name: 'Bamicha Supplies',
              description: 'Premium food supplier',
            },
          ],
        },
      },
    })
    console.log('✓ Supplier created')
  } else {
    console.log('✓ Supplier already exists')
  }

  // =================================================================================================
  // 6. INVENTORY
  // =================================================================================================
  console.log('Creating inventory...')
  const inventoryItemsData = [
    { name: 'Bánh mì (Vỏ)', unit: 'cái', quantity: 50, threshold: 10 },
    { name: 'Pate', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Chả lụa', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Trứng', unit: 'quả', quantity: 100, threshold: 20 },
    { name: 'Dưa chuột', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Gạo nếp', unit: 'kg', quantity: 20, threshold: 5 },
    { name: 'Hành phi', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Chanh', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Đường', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Cafe', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Sữa đặc', unit: 'hộp', quantity: 20, threshold: 5 },
  ]

  const inventoryMap = new Map<string, string>() // Name -> ID

  for (const item of inventoryItemsData) {
    // Check if item exists in this restaurant
    const existingInv = await prisma.inventory.findFirst({
      where: {
        restaurantId: restaurant.id,
        itemName: item.name,
      },
    })

    if (!existingInv) {
      const inv = await prisma.inventory.create({
        data: {
          restaurantId: restaurant.id,
          supplierId: supplier.id,
          itemName: item.name,
          unit: item.unit,
          quantity: item.quantity,
          threshold: item.threshold,
        },
      })
      inventoryMap.set(item.name, inv.id)
      console.log(`Created inventory: ${item.name}`)
    } else {
      inventoryMap.set(item.name, existingInv.id)
      // console.log(`Skipped inventory: ${item.name}`)
    }
  }
  console.log('✓ Inventory created/checked')

  // =================================================================================================
  // 7. CATEGORIES
  // =================================================================================================
  console.log('Creating categories...')

  // Helper to get or create category
  const getOrCreateCategory = async (
    viName: string,
    enName: string,
    viDesc: string,
    enDesc: string,
  ) => {
    // Check by EN name translation
    // We can't easy query deep relation with exact match easily in standard prisma without some overhead or raw query
    // BUT we can search: findFirst where categoryTranslations some (languageId='en' AND name=enName)
    const existing = await prisma.dishCategory.findFirst({
      where: {
        dishCategoryTranslations: {
          some: {
            languageId: enLang.id,
            name: enName,
          },
        },
      },
    })

    if (existing) return existing

    return await prisma.dishCategory.create({
      data: {
        dishCategoryTranslations: {
          create: [
            { languageId: viLang.id, name: viName, description: viDesc },
            { languageId: enLang.id, name: enName, description: enDesc },
          ],
        },
      },
    })
  }

  const banhMiCat = await getOrCreateCategory(
    'Bánh Mì',
    'Banh Mi',
    'Bánh mì nóng giòn',
    'Vietnamese Baguette',
  )
  const xoiCat = await getOrCreateCategory('Xôi', 'Sticky Rice', 'Xôi các loại', 'Sticky Rice')
  const drinkCat = await getOrCreateCategory('Đồ Uống', 'Drinks', 'Giải khát', 'Beverages')
  const snackCat = await getOrCreateCategory('Ăn Vặt', 'Snacks', 'Đồ ăn nhẹ', 'Light snacks')
  const nemNuongCat = await getOrCreateCategory(
    'Nem Nướng',
    'Grilled Pork Sausage',
    'Nem nướng Nha Trang',
    'Grilled Pork Sausage',
  )
  const banhCaCat = await getOrCreateCategory(
    'Bánh Cá',
    'Taiyaki',
    'Bánh cá Taiyaki',
    'Fish-shaped cake',
  )

  console.log('✓ Categories created/checked')

  // =================================================================================================
  // 8. DISHES & RECIPES
  // =================================================================================================
  console.log('Creating dishes...')

  interface DishSeedData {
    vi: { name: string; desc: string }
    en: { name: string; desc: string }
    price: number
    catId: string
    images?: string[]
    variants?: { name: string; options: { value: string; price?: number }[] }[]
    recipe?: { ingredientName: string; quantity: number }[]
  }

  const dishes: DishSeedData[] = [
    // --- BÁNH MÌ ---
    {
      vi: { name: 'Bánh mì chả nóng', desc: 'Nhân chả thơm ngon' },
      en: { name: 'Hot Pork Roll Banh Mi', desc: 'With hot pork roll' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate chả nóng', desc: 'Pate béo ngậy và chả' },
      en: { name: 'Pate & Pork Roll Banh Mi', desc: 'Pate and pork roll' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì chả ruốc', desc: 'Chả và ruốc bông' },
      en: { name: 'Pork Roll & Floss Banh Mi', desc: 'Pork roll and meat floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì giò nóng', desc: 'Giò lụa nóng hổi' },
      en: { name: 'Hot Vietnamese Sausage Banh Mi', desc: 'Hot sausage' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate giò nóng', desc: 'Pate và giò' },
      en: { name: 'Pate & Sausage Banh Mi', desc: 'Pate and sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770818610/restaurant-app/dishes/lxaxii1b6yezzcjvmhtj.jpg',
      ],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì giò ruốc', desc: 'Giò và ruốc' },
      en: { name: 'Sausage & Floss Banh Mi', desc: 'Sausage and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì lườn ngỗng', desc: 'Lườn ngỗng hun khói' },
      en: { name: 'Smoked Goose Breast Banh Mi', desc: 'Smoked goose breast' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770818519/restaurant-app/dishes/ingfvc6xhphd5wm0iqqz.jpg',
      ],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate lườn ngỗng', desc: 'Pate và lườn ngỗng' },
      en: { name: 'Pate & Goose Breast Banh Mi', desc: 'Pate and goose breast' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì lườn ruốc', desc: 'Lườn ngỗng và ruốc' },
      en: { name: 'Goose Breast & Floss Banh Mi', desc: 'Goose breast and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì xá xíu', desc: 'Thịt xá xíu đậm đà' },
      en: { name: 'Char Siu Banh Mi', desc: 'BBQ pork' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate xá xíu', desc: 'Pate và xá xíu' },
      en: { name: 'Pate & Char Siu Banh Mi', desc: 'Pate and BBQ pork' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì xá xíu ruốc', desc: 'Xá xíu và ruốc' },
      en: { name: 'Char Siu & Floss Banh Mi', desc: 'BBQ pork and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì nem nướng', desc: 'Nem nướng thơm lừng' },
      en: { name: 'Grilled Sausage Banh Mi', desc: 'Grilled sausage' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate nem nướng', desc: 'Pate và nem nướng' },
      en: { name: 'Pate & Grilled Sausage Banh Mi', desc: 'Pate and grilled sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814709/restaurant-app/dishes/u2xamxvpgbxgvvml1hjw.jpg',
      ],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì nem nướng ruốc', desc: 'Nem nướng và ruốc' },
      en: { name: 'Grilled Sausage & Floss Banh Mi', desc: 'Grilled sausage and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì trứng chả', desc: 'Trứng ốp và chả' },
      en: { name: 'Egg & Pork Roll Banh Mi', desc: 'Fried egg and pork roll' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì trứng giò', desc: 'Trứng ốp và giò' },
      en: { name: 'Egg & Sausage Banh Mi', desc: 'Fried egg and sausage' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì trứng ruốc', desc: 'Trứng và ruốc' },
      en: { name: 'Egg & Floss Banh Mi', desc: 'Fried egg and floss' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì trứng bò khô', desc: 'Trứng và bò khô' },
      en: { name: 'Egg & Beef Jerky Banh Mi', desc: 'Egg and beef jerky' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì trứng xúc xích', desc: 'Trứng và xúc xích' },
      en: { name: 'Egg & Sausage Banh Mi', desc: 'Egg and sausage' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì 2 trứng', desc: 'Hai trứng ốp la' },
      en: { name: 'Double Egg Banh Mi', desc: 'Two fried eggs' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate trứng', desc: 'Pate và trứng' },
      en: { name: 'Pate & Egg Banh Mi', desc: 'Pate and egg' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814656/restaurant-app/dishes/ktg0ojt5rpq2cl1xcmlm.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate xúc xích', desc: 'Pate và xúc xích' },
      en: { name: 'Pate & Sausage Banh Mi', desc: 'Pate and sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814550/restaurant-app/dishes/kmpjcl9vucw336twrjyj.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì xúc xích ruốc', desc: 'Xúc xích và ruốc' },
      en: { name: 'Sausage & Floss Banh Mi', desc: 'Sausage and floss' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì xúc xích bò khô', desc: 'Xúc xích và bò khô' },
      en: { name: 'Sausage & Beef Jerky Banh Mi', desc: 'Sausage and beef jerky' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate lạp xưởng', desc: 'Pate và lạp xưởng' },
      en: { name: 'Pate & Chinese Sausage Banh Mi', desc: 'Pate and chinese sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814335/restaurant-app/dishes/g9nbh5b2oakg0leuhrob.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate', desc: 'Sốt pate đặc biệt' },
      en: { name: 'Pate Banh Mi', desc: 'Special pate' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770810580/Screenshot_2026-02-08_203316_qkihfi.png',
      ],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì bò khô', desc: 'Nhân bò khô' },
      en: { name: 'Beef Jerky Banh Mi', desc: 'Beef jerky' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì ruốc', desc: 'Nhân ruốc' },
      en: { name: 'Floss Banh Mi', desc: 'Meat floss' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì xúc xích', desc: 'Nhân xúc xích' },
      images: [''],
      en: { name: 'Sausage Banh Mi', desc: 'Sausage' },
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì 1 trứng', desc: 'Một trứng ốp la' },
      en: { name: 'Single Egg Banh Mi', desc: 'One fried egg' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate ruốc', desc: 'Pate và ruốc' },
      en: { name: 'Pate & Floss Banh Mi', desc: 'Pate and floss' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770818832/restaurant-app/dishes/oshk7lyn8unoyetvcuza.jpg',
      ],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì pate bò khô', desc: 'Pate và bò khô' },
      en: { name: 'Pate & Beef Jerky Banh Mi', desc: 'Pate and beef jerky' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819011/restaurant-app/dishes/u5fjwdaemq5tkyxh8fth.jpg',
      ],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì bơ sữa', desc: 'Ngọt ngào bơ sữa' },
      en: { name: 'Butter & Milk Banh Mi', desc: 'Butter and condensed milk' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì thập cẩm', desc: 'Tổng hợp các loại nhân' },
      images: [''],
      en: { name: 'Mixed Banh Mi', desc: 'Fully loaded' },
      price: 30000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì đặc biệt', desc: 'Phần nhân siêu đầy đặn' },
      images: [''],
      en: { name: 'Special Banh Mi', desc: 'Super loaded' },
      price: 40000,
      catId: banhMiCat.id,
    },
    {
      vi: { name: 'Bánh mì không', desc: 'Bánh mì giòn tan' },
      en: { name: 'Plain Banh Mi', desc: 'Crispy baguette' },
      images: [''],
      price: 5000,
      catId: banhMiCat.id,
    },

    // --- XÔI ---
    {
      vi: { name: 'Xôi pate ruốc', desc: 'Xôi dẻo với pate ruốc' },
      en: { name: 'Pate & Floss Sticky Rice', desc: 'Sticky rice with pate and floss' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819462/restaurant-app/dishes/renkkvpkgclfosrukffp.jpg',
      ],
      price: 20000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi pate trứng', desc: 'Xôi pate trứng' },
      en: { name: 'Pate & Egg Sticky Rice', desc: 'Pate and egg' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819595/restaurant-app/dishes/mlhaxymasbrgmhl3vjmb.jpg',
      ],
      price: 20000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi pate xúc xích', desc: 'Xôi pate xúc xích' },
      en: { name: 'Pate & Sausage Sticky Rice', desc: 'Pate and sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819897/restaurant-app/dishes/tbktqmlpcicrt5lo4fmp.jpg',
      ],
      price: 20000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi trứng xúc xích', desc: 'Xôi trứng xúc xích' },
      en: { name: 'Egg & Sausage Sticky Rice', desc: 'Egg and sausage' },
      images: [''],
      price: 20000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi trứng ruốc', desc: 'Xôi trứng ruốc' },
      en: { name: 'Egg & Floss Sticky Rice', desc: 'Egg and floss' },
      images: [''],
      price: 20000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi 2 trứng', desc: 'Xôi với 2 trứng' },
      en: { name: 'Double Egg Sticky Rice', desc: 'Sticky rice with 2 eggs' },
      images: [''],
      price: 20000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi trứng chả', desc: 'Xôi trứng chả' },
      en: { name: 'Egg & Pork Roll Sticky Rice', desc: 'Egg and pork roll' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi trứng giò', desc: 'Xôi trứng giò' },
      en: { name: 'Egg & Sausage Sticky Rice', desc: 'Egg and sausage' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi pate chả', desc: 'Xôi pate chả' },
      en: { name: 'Pate & Pork Roll Sticky Rice', desc: 'Pate and pork roll' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi pate giò', desc: 'Xôi pate giò' },
      en: { name: 'Pate & Sausage Sticky Rice', desc: 'Pate and sausage' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi chả ruốc', desc: 'Xôi chả ruốc' },
      en: { name: 'Pork Roll & Floss Sticky Rice', desc: 'Pork roll and floss' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi giò ruốc', desc: 'Xôi giò ruốc' },
      en: { name: 'Sausage & Floss Sticky Rice', desc: 'Sausage and floss' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi thập cẩm', desc: 'Đầy đủ toping' },
      en: { name: 'Mixed Sticky Rice', desc: 'Mixed toppings' },
      images: [''],
      price: 30000,
      catId: xoiCat.id,
    },
    {
      vi: { name: 'Xôi thập cẩm trứng', desc: 'Thập cẩm thêm trứng' },
      en: { name: 'Mixed Sticky Rice with Egg', desc: 'Mixed toppings with egg' },
      images: [''],
      price: 35000,
      catId: xoiCat.id,
    },

    // --- NEM NƯỚNG ---
    {
      vi: { name: 'Nem nướng suất vừa', desc: 'Suất vừa ăn' },
      en: { name: 'Grilled Sausage (Medium)', desc: 'Medium portion' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000800/restaurant-app/dishes/bgdi6uhodcyi4joriepi.jpg',
      ],
      price: 35000,
      catId: nemNuongCat.id,
    },
    {
      vi: { name: 'Nem nướng suất lớn', desc: 'Suất lớn đầy đặn' },
      en: { name: 'Grilled Sausage (Large)', desc: 'Large portion' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000788/restaurant-app/dishes/ecqt9zrntxwrrvbk7njk.jpg',
      ],
      price: 45000,
      catId: nemNuongCat.id,
    },

    // --- BÁNH CÁ ---
    {
      vi: { name: 'Bánh cá kem sữa', desc: 'Nhân kem sữa' },
      en: { name: 'Custard Taiyaki', desc: 'Custard filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá sô cô la', desc: 'Nhân chocolate' },
      en: { name: 'Chocolate Taiyaki', desc: 'Chocolate filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá trà xanh', desc: 'Nhân trà xanh' },
      en: { name: 'Matcha Taiyaki', desc: 'Matcha filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá phomai kéo sợi', desc: 'Phomai mozzarella' },
      en: { name: 'Cheese Taiyaki', desc: 'Mozzarella cheese' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá pate', desc: 'Nhân pate' },
      en: { name: 'Pate Taiyaki', desc: 'Pate filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá xúc xích', desc: 'Nhân xúc xích' },
      en: { name: 'Sausage Taiyaki', desc: 'Sausage filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá bò khô', desc: 'Nhân bò khô' },
      en: { name: 'Beef Jerky Taiyaki', desc: 'Beef jerky filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá ruốc', desc: 'Nhân ruốc' },
      en: { name: 'Floss Taiyaki', desc: 'Floss filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá ngô', desc: 'Nhân ngô' },
      en: { name: 'Corn Taiyaki', desc: 'Corn filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá sốt dâu', desc: 'Sốt dâu' },
      en: { name: 'Strawberry Taiyaki', desc: 'Strawberry sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá sốt việt quất', desc: 'Sốt việt quất' },
      en: { name: 'Blueberry Taiyaki', desc: 'Blueberry sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá sốt xoài', desc: 'Sốt xoài' },
      en: { name: 'Mango Taiyaki', desc: 'Mango sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá sốt đào', desc: 'Sốt đào' },
      en: { name: 'Peach Taiyaki', desc: 'Peach sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
    },
    {
      vi: { name: 'Bánh cá không nhân', desc: 'Vỏ giòn' },
      en: { name: 'Plain Taiyaki', desc: 'No filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 7000,
      catId: banhCaCat.id,
    },

    // --- ĐỒ ĂN VẶT ---
    {
      vi: { name: 'Bỏng ngô', desc: 'Bỏng ngô giòn' },
      en: { name: 'Popcorn', desc: 'Crispy popcorn' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999651/restaurant-app/dishes/geoa0aym9qspidgmhg7x.jpg',
      ],
      price: 25000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Nem chua rán', desc: 'Nem chua rán Hà Nội' },
      en: { name: 'Fried Fermented Pork', desc: 'Fried sour pork' },
      images: [''],
      price: 25000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Khoai lang kén', desc: 'Khoai lang kén vàng ươm' },
      en: { name: 'Sweet Potato Cocoons', desc: 'Fried sweet potato' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999931/restaurant-app/dishes/jtmcfqcglesuqfni1ufj.jpg',
      ],
      price: 25000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Khoai tây rán', desc: 'Khoai tây chiên' },
      en: { name: 'French Fries', desc: 'Fried potato' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999843/restaurant-app/dishes/agm4yb1x0ioajgkuylps.jpg',
      ],
      price: 20000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Cá viên chiên', desc: 'Cá viên chiên' },
      en: { name: 'Fried Fish Balls', desc: 'Fish balls' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999426/restaurant-app/dishes/r9hat4onkgrph6ykamsm.jpg',
      ],
      price: 20000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Xúc xích', desc: 'Xúc xích chiên' },
      en: { name: 'Fried Sausage', desc: 'Sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999197/restaurant-app/dishes/jalybe4aqft1muwmclke.jpg',
      ],
      price: 10000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Lạp xưởng', desc: 'Lạp xưởng tươi' },
      en: { name: 'Chinese Sausage', desc: 'Chinese sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999139/restaurant-app/dishes/jvpa3vdjfqmj64njvuv5.jpg',
      ],
      price: 10000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Hướng dương mộc', desc: 'Hạt hướng dương' },
      en: { name: 'Sunflower Seeds', desc: 'Sunflower seeds' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999519/restaurant-app/dishes/tqklnn9dhgfemkzuxobg.jpg',
      ],
      price: 10000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Bò khô vắt tắc', desc: 'Bò khô chanh' },
      en: { name: 'Beef Jerky w/ Lime', desc: 'Beef jerky with lime' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999581/restaurant-app/dishes/wnvueyu04fvxesdjp1np.jpg',
      ],
      price: 15000,
      catId: snackCat.id,
    },
    {
      vi: { name: 'Kem cốc', desc: 'Kem mát lạnh' },
      en: { name: 'Ice Cream Cup', desc: 'Ice cream' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770998988/restaurant-app/dishes/brf4gpubslmgevn5xur4.jpg',
      ],
      price: 5000,
      catId: snackCat.id,
    },

    // --- ĐỒ UỐNG (Giữ lại mẫu) ---
    {
      vi: { name: 'Trà chanh', desc: 'Trà chanh tươi mát' },
      en: { name: 'Lime Tea', desc: 'Fresh lime tea' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 10000,
      catId: drinkCat.id,
    },
    {
      vi: { name: 'Cafe sữa', desc: 'Cà phê nâu đá' },
      en: { name: 'Milk Coffee', desc: 'Vietnamese milk coffee' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828480/restaurant-app/dishes/utpftxpwkiyd92pgz4oc.jpg',
      ],
      price: 18000,
      catId: drinkCat.id,
    },
  ]

  for (const dishData of dishes) {
    // Check existence by EN name
    const existingDish = await prisma.dish.findFirst({
      where: {
        dishTranslations: {
          some: {
            languageId: enLang.id,
            name: dishData.en.name,
          },
        },
      },
    })

    if (existingDish) {
      // console.log(`Skipped dish: ${dishData.en.name}`)
      continue
    }

    const dish = await prisma.dish.create({
      data: {
        basePrice: dishData.price,
        supplierId: supplier.id,
        categories: { connect: { id: dishData.catId } },
        images: (dishData.images || []).filter((img) => img !== ''),
        isActive: true, // Ensuring default active

        dishTranslations: {
          create: [
            { languageId: viLang.id, name: dishData.vi.name, description: dishData.vi.desc },
            { languageId: enLang.id, name: dishData.en.name, description: dishData.en.desc },
          ],
        },
      },
    })

    // Create Recipe (Inventory Dish Link)
    if (dishData.recipe) {
      for (const ingredient of dishData.recipe) {
        const invId = inventoryMap.get(ingredient.ingredientName)
        if (invId) {
          await prisma.inventoryDish.create({
            data: {
              dishId: dish.id,
              inventoryId: invId,
              quantityUsed: ingredient.quantity,
            },
          })
        }
      }
    }

    // Create Default SKU (Base Dish)
    await prisma.sKU.create({
      data: {
        dishId: dish.id,
        price: dishData.price,
        stock: 100,
        value: 'DEFAULT',
        dishSKUSnapshots: {
          create: {
            dishName: dishData.vi.name,
            price: dishData.price,
            skuValue: 'DEFAULT',
          },
        },
      },
    })

    // Create Variants & SKUs
    if (dishData.variants) {
      for (const variantData of dishData.variants) {
        const variant = await prisma.variant.create({
          data: {
            name: variantData.name,
            dishId: dish.id,
          },
        })

        for (const option of variantData.options) {
          const variantOption = await prisma.variantOption.create({
            data: {
              value: option.value,
              variantId: variant.id,
            },
          })

          await prisma.sKU.create({
            data: {
              dishId: dish.id,
              price: Number(dishData.price) + (option.price || 0),
              stock: 50,
              value: option.value,
              variantOptions: { connect: { id: variantOption.id } },
              dishSKUSnapshots: {
                create: {
                  dishName: dishData.vi.name,
                  price: Number(dishData.price) + (option.price || 0),
                  skuValue: option.value,
                },
              },
            },
          })
        }
      }
    }
    console.log(`Created dish: ${dishData.en.name}`)
  }
  console.log('✓ Dishes created/checked')

  // =================================================================================================
  // 9. PROMOTIONS
  // =================================================================================================
  console.log('Creating promotions...')

  const promo1 = await prisma.promotion.findFirst({ where: { code: 'WELCOME50' } })
  if (!promo1) {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)

    await prisma.promotion.create({
      data: {
        code: 'WELCOME50',
        type: 'PERCENTAGE',
        amount: 0,
        percentage: 50,
        minOrderValue: 100000,
        validFrom: today,
        validTo: nextMonth,
        usageLimit: 100,
      },
    })
    console.log('✓ Promotion WELCOME50 created')
  }

  const promo2 = await prisma.promotion.findFirst({ where: { code: 'SUMMER_SALE' } })
  if (!promo2) {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)

    await prisma.promotion.create({
      data: {
        code: 'SUMMER_SALE',
        type: 'FIXED',
        amount: 20000,
        percentage: 0,
        validFrom: today,
        validTo: nextMonth,
        minOrderValue: 50000,
      },
    })
    console.log('✓ Promotion SUMMER_SALE created')
  }
  console.log('✓ Promotions created/checked')

  // =================================================================================================
  // 10. RESERVATIONS
  // =================================================================================================
  console.log('Creating reservations...')

  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId: restaurant.id },
    take: 3,
  })

  if (tables.length > 0) {
    const today = new Date()
    // 1. Pending (Tomorrow 19:00)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    tomorrow.setHours(19, 0, 0, 0)

    // 2. Confirmed (Next week 20:00)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    nextWeek.setHours(20, 0, 0, 0)

    // 3. Completed (Yesterday 18:30)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    yesterday.setHours(18, 30, 0, 0)

    const reservationsData = [
      {
        userId: clientUser.id,
        tableId: tables[0].id,
        reservationTime: tomorrow,
        guests: 2,
        status: ReservationStatus.PENDING,
        notes: 'Gần cửa sổ',
        channel: Channel.WEB,
      },
      {
        userId: clientUser.id,
        tableId: tables[tables.length > 1 ? 1 : 0].id,
        reservationTime: nextWeek,
        guests: 4,
        status: ReservationStatus.CONFIRMED,
        channel: Channel.WEB,
      },
      {
        userId: clientUser.id,
        tableId: tables[0].id,
        reservationTime: yesterday,
        guests: 2,
        status: ReservationStatus.COMPLETED,
        notes: 'Sinh nhật',
        channel: Channel.WEB,
      },
      {
        userId: clientUser.id,
        tableId: tables[tables.length > 1 ? 1 : 0].id,
        reservationTime: yesterday,
        guests: 4,
        status: ReservationStatus.CANCELLED,
        notes: 'Bận đột xuất',
        channel: Channel.WEB,
      },
    ]

    for (const res of reservationsData) {
      const exists = await prisma.reservation.findFirst({
        where: {
          userId: res.userId,
          reservationTime: res.reservationTime,
        },
      })
      if (!exists) {
        await prisma.reservation.create({
          data: res,
        })
      }
    }
    console.log('✓ Reservations created')
  }

  // =================================================================================================
  // 11. MOCK ORDERS & REVIEWS
  // =================================================================================================
  console.log('Creating mock orders & reviews...')

  // Only create if we have very few orders to avoid duplicating on every seed
  const orderCount = await prisma.order.count()

  if (orderCount < 5) {
    const allDishes = await prisma.dish.findMany()
    const table = await prisma.restaurantTable.findFirst({ where: { restaurantId: restaurant.id } })

    if (allDishes.length > 0 && table) {
      // Fetch English names for dishes to use in snapshots
      const dishesWithTrans = await prisma.dish.findMany({
        include: {
          dishTranslations: {
            where: { languageId: enLang.id },
          },
          skus: {
            where: { value: 'DEFAULT' }, // Changed skuValue to value based on schema
            take: 1,
          },
        },
      })

      // Create 20 random past orders
      for (let i = 0; i < 20; i++) {
        const isCompleted = Math.random() > 0.3
        const status = isCompleted ? 'COMPLETED' : Math.random() > 0.5 ? 'PENDING' : 'CANCELLED'

        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)) // Random last 30 days

        // Random 1-3 items
        const numItems = Math.floor(Math.random() * 3) + 1
        let totalAmount = 0
        const orderItemsData: Prisma.DishSKUSnapshotUncheckedCreateWithoutOrderInput[] = []

        for (let j = 0; j < numItems; j++) {
          const dish = dishesWithTrans[Math.floor(Math.random() * dishesWithTrans.length)]
          const qty = Math.floor(Math.random() * 2) + 1
          const price = Number(dish.basePrice) || 20000
          const dishName = dish.dishTranslations[0]?.name || 'Unknown Dish'
          // Use default SKU if available
          const skuId = dish.skus[0]?.id

          totalAmount += price * qty

          orderItemsData.push({
            dishName: dishName,
            quantity: qty,
            price: new Prisma.Decimal(price),
            skuValue: 'DEFAULT', // Assuming default for mock
            skuId: skuId,
            // Removed 'note' as it's not in DishSKUSnapshot
          })
        }

        const order = await prisma.order.create({
          data: {
            restaurantId: restaurant.id,
            tableId: table.id,
            totalAmount: new Prisma.Decimal(totalAmount),
            status: status as any,
            channel: 'WEB', // Added channel as it might be required
            createdAt: createdAt,
            updatedAt: createdAt,
            items: {
              // Changed from orderItems to items
              create: orderItemsData,
            },
          },
        })

        // Add review for completed orders
        if (status === 'COMPLETED' && Math.random() > 0.6) {
          // Pick a random dish from the order to review
          const randomDishItem = dishesWithTrans.find(
            (d) => d.dishTranslations[0]?.name === orderItemsData[0].dishName,
          )

          if (randomDishItem) {
            await prisma.review.create({
              data: {
                dishId: randomDishItem.id, // Linked to a specific dish
                userId: adminUser.id, // Needs a user, usage admin for seed
                content: Math.random() > 0.5 ? 'Very delicious!' : 'Great service!', // 'content' not 'comment' based on schema?
                rating: Math.floor(Math.random() * 2) + 4,
              },
            })
          }
        }
      }
      console.log('✓ Mock orders & reviews created')
    }
  } else {
    console.log('✓ Mock orders/reviews skipped (already enough data)')
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
