import * as bcrypt from 'bcrypt'
import {
  PrismaClient,
  UserStatus,
  HTTPMethod,
  StaffPosition,
  ReservationStatus,
  Channel,
  Prisma,
  OrderStatus,
  PaymentStatus,
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
    // Delete orders and related details first
    await prisma.paymentTransaction.deleteMany({})
    await prisma.dishSKUSnapshot.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.reservation.deleteMany({})

    // Interactions, Carts, Reviews, Messages
    await prisma.userInteraction.deleteMany({})
    await prisma.cartItem.deleteMany({})
    await prisma.review.deleteMany({})
    await prisma.recommendation.deleteMany({})
    await prisma.notification.deleteMany({})
    await prisma.message.deleteMany({})

    // Inventory
    await prisma.inventoryDish.deleteMany({})
    await prisma.inventoryTransaction.deleteMany({})
    await prisma.inventory.deleteMany({})

    await prisma.promotion.deleteMany({})

    // Dishes & SKUs
    await prisma.sKU.deleteMany({})
    await prisma.variantOption.deleteMany({})
    await prisma.variant.deleteMany({})
    await prisma.dishTranslation.deleteMany({})
    await prisma.dish.deleteMany({})

    // Categories
    await prisma.dishCategoryTranslation.deleteMany({})
    await prisma.dishCategory.deleteMany({})

    // Restaurant & Tables
    await prisma.restaurantStaff.deleteMany({})
    await prisma.restaurantTable.deleteMany({})
    await prisma.restaurant.deleteMany({})

    // Suppliers
    await prisma.supplierTranslation.deleteMany({})
    await prisma.supplier.deleteMany({})

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
    { name: 'Xúc xích', unit: 'chiếc', quantity: 50, threshold: 10 },
    { name: 'Lạp xưởng', unit: 'chiếc', quantity: 30, threshold: 5 },
    { name: 'Ruốc thịt', unit: 'kg', quantity: 3, threshold: 0.5 },
    { name: 'Bò khô', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Xá xíu', unit: 'kg', quantity: 3, threshold: 1 },
    { name: 'Lườn ngỗng', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Nem nướng', unit: 'chiếc', quantity: 50, threshold: 10 },
    { name: 'Bơ', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Sốt Mayonnaise', unit: 'chai', quantity: 10, threshold: 2 },
    { name: 'Tương ớt', unit: 'chai', quantity: 10, threshold: 2 },
    { name: 'Rau mùi', unit: 'mớ', quantity: 20, threshold: 5 },
    { name: 'Bột mì', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Sữa tươi', unit: 'lít', quantity: 10, threshold: 2 },
    { name: 'Phô mai sợi', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Sốt Chocolate', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Sốt Dâu', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Sốt Trà xanh', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Bắp hạt', unit: 'hộp', quantity: 10, threshold: 2 },
    { name: 'Khoai lang', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Khoai tây', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Kem', unit: 'hộp', quantity: 5, threshold: 1 },
    { name: 'Bỏng ngô (nguyên liệu)', unit: 'kg', quantity: 3, threshold: 0.5 },
    { name: 'Nem chua', unit: 'chiếc', quantity: 50, threshold: 10 },
    { name: 'Cá viên', unit: 'gói', quantity: 10, threshold: 2 },
    { name: 'Hạt hướng dương', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Trà chanh (gói)', unit: 'gói', quantity: 20, threshold: 5 },
    { name: 'Trà ô long', unit: 'gói', quantity: 20, threshold: 5 },
    { name: 'Trà nhài', unit: 'gói', quantity: 20, threshold: 5 },
    { name: 'Trà đào (túi lọc)', unit: 'gói', quantity: 20, threshold: 5 },
    { name: 'Trân châu đen', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Trân châu trắng', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Thạch cốt dừa', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Đào ngâm', unit: 'hộp', quantity: 10, threshold: 2 },
    { name: 'Sữa đặc', unit: 'hộp', quantity: 10, threshold: 2 },
    { name: 'Vải ngâm', unit: 'hộp', quantity: 10, threshold: 2 },
    { name: 'Kem Vani', unit: 'hộp', quantity: 5, threshold: 1 },
    { name: 'Kem Chocolate', unit: 'hộp', quantity: 5, threshold: 1 },
    { name: 'Kem Dâu', unit: 'hộp', quantity: 5, threshold: 1 },
    { name: 'Kem Matcha', unit: 'hộp', quantity: 5, threshold: 1 },
    { name: 'Siro Dâu', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Siro Việt Quất', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Siro Đào', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Siro Xoài', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Đồ chua (Cà rốt & củ cải)', unit: 'kg', quantity: 10, threshold: 2 },
    { name: 'Nước tương', unit: 'chai', quantity: 10, threshold: 2 },
    { name: 'Nước sốt (Bánh mì)', unit: 'lít', quantity: 5, threshold: 1 },
    { name: 'Hạt tiêu', unit: 'gói', quantity: 10, threshold: 2 },
    { name: 'Cùi bưởi (đã chế biến)', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Đậu xanh', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Cốt dừa', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Caramen (Bánh flan)', unit: 'cái', quantity: 50, threshold: 10 },
    { name: 'Thạch sương sáo', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Sợi Thái (Cendol)', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Bột năng', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Nha đam', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Bột Milo', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Hoa quả (Mix)', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Sữa chua (hũ)', unit: 'hộp', quantity: 50, threshold: 10 },
    { name: 'Đá viên', unit: 'kg', quantity: 20, threshold: 5 },
    { name: 'Quả tắc (Quất)', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Táo đỏ', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Long nhãn', unit: 'kg', quantity: 2, threshold: 0.5 },
    { name: 'Mãng cầu tươi', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Kem cheese (Milkfoam)', unit: 'kg', quantity: 3, threshold: 1 },
    { name: 'Chanh leo', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Hồng trà (gói)', unit: 'gói', quantity: 50, threshold: 10 },
    { name: 'Trân châu trắng', unit: 'kg', quantity: 5, threshold: 1 },
    { name: 'Đường đen (siro)', unit: 'chai', quantity: 5, threshold: 1 },
    { name: 'Siro Bạc hà', unit: 'chai', quantity: 3, threshold: 1 },
    { name: 'Siro Hạt dẻ', unit: 'chai', quantity: 3, threshold: 1 },
    { name: 'Siro Socola', unit: 'chai', quantity: 3, threshold: 1 },
    { name: 'Sốt Cacao', unit: 'chai', quantity: 3, threshold: 1 },
    { name: 'Muối (tinh)', unit: 'kg', quantity: 1, threshold: 0.2 },
    { name: 'Hạt chia', unit: 'kg', quantity: 1, threshold: 0.1 },
    { name: 'Quả dừa tươi', unit: 'quả', quantity: 20, threshold: 5 },
    { name: 'Coca lon', unit: 'lon', quantity: 48, threshold: 12 },
    { name: 'Nước khoáng Lavie', unit: 'chai', quantity: 48, threshold: 12 },
    { name: 'Sữa đậu nành', unit: 'lít', quantity: 10, threshold: 2 },
    { name: 'Gừng tươi', unit: 'kg', quantity: 1, threshold: 0.2 },
    { name: 'Mật ong', unit: 'chai', quantity: 2, threshold: 0.5 },
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
  const cheCat = await getOrCreateCategory(
    'Chè',
    'Vietnamese Sweet Soups',
    'Chè truyền thống',
    'Traditional sweet soups',
  )
  const tauHuCat = await getOrCreateCategory(
    'Tàu Hũ',
    'Tofu Pudding',
    'Tàu hũ mềm mát',
    'Soft tofu pudding',
  )
  const suaChuaCat = await getOrCreateCategory(
    'Sữa Chua',
    'Yogurt',
    'Sữa chua các loại',
    'Various yogurts',
  )
  const traCat = await getOrCreateCategory(
    'Trà Trái Cây',
    'Fruit Teas',
    'Trà hoa quả thanh nhiệt',
    'Refreshing fruit teas',
  )
  const cafeCat = await getOrCreateCategory(
    'Cà Phê',
    'Coffee',
    'Cà phê truyền thống',
    'Vietnamese traditional coffee',
  )
  const traSuaCat = await getOrCreateCategory(
    'Trà Sữa',
    'Milk Teas',
    'Trà sữa béo ngậy',
    'Creamy milk teas',
  )
  const suaTuoiCat = await getOrCreateCategory(
    'Sữa Tươi',
    'Fresh Milk',
    'Sữa tươi các loại',
    'Fresh milk drinks',
  )
  const hotDrinkCat = await getOrCreateCategory(
    'Đồ Uống Nóng',
    'Hot Drinks',
    'Các loại trà và sữa uống nóng',
    'Selection of hot beverages',
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
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 }, // 50g
        { ingredientName: 'Rau mùi', quantity: 0.1 }, // 1/10 mớ
        { ingredientName: 'Tương ớt', quantity: 0.02 }, // 20ml
      ],
    },
    {
      vi: { name: 'Bánh mì pate chả nóng', desc: 'Pate béo ngậy và chả' },
      en: { name: 'Pate & Pork Roll Banh Mi', desc: 'Pate and pork roll' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 }, // 30g
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Bánh mì chả ruốc', desc: 'Chả và ruốc bông' },
      en: { name: 'Pork Roll & Floss Banh Mi', desc: 'Pork roll and meat floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 }, // 20g
        { ingredientName: 'Rau mùi', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Bánh mì giò nóng', desc: 'Giò lụa nóng hổi' },
      en: { name: 'Hot Vietnamese Sausage Banh Mi', desc: 'Hot sausage' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 }, // Tạm dùng chả lụa thay giò lụa
        { ingredientName: 'Rau mùi', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate giò nóng', desc: 'Pate và giò' },
      en: { name: 'Pate & Sausage Banh Mi', desc: 'Pate and sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770818610/restaurant-app/dishes/lxaxii1b6yezzcjvmhtj.jpg',
      ],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Bánh mì giò ruốc', desc: 'Giò và ruốc' },
      en: { name: 'Sausage & Floss Banh Mi', desc: 'Sausage and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Bánh mì lườn ngỗng', desc: 'Lườn ngỗng hun khói' },
      en: { name: 'Smoked Goose Breast Banh Mi', desc: 'Smoked goose breast' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770818519/restaurant-app/dishes/ingfvc6xhphd5wm0iqqz.jpg',
      ],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Lườn ngỗng', quantity: 0.05 }, // 50g
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate lườn ngỗng', desc: 'Pate và lườn ngỗng' },
      en: { name: 'Pate & Goose Breast Banh Mi', desc: 'Pate and goose breast' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Lườn ngỗng', quantity: 0.05 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì lườn ruốc', desc: 'Lườn ngỗng và ruốc' },
      en: { name: 'Goose Breast & Floss Banh Mi', desc: 'Goose breast and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Lườn ngỗng', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì xá xíu', desc: 'Thịt xá xíu đậm đà' },
      en: { name: 'Char Siu Banh Mi', desc: 'BBQ pork' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Xá xíu', quantity: 0.05 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate xá xíu', desc: 'Pate và xá xíu' },
      en: { name: 'Pate & Char Siu Banh Mi', desc: 'Pate and BBQ pork' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Xá xíu', quantity: 0.05 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì xá xíu ruốc', desc: 'Xá xíu và ruốc' },
      en: { name: 'Char Siu & Floss Banh Mi', desc: 'BBQ pork and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Xá xíu', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì nem nướng', desc: 'Nem nướng thơm lừng' },
      en: { name: 'Grilled Sausage Banh Mi', desc: 'Grilled sausage' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Nem nướng', quantity: 1 }, // 1 chiếc
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate nem nướng', desc: 'Pate và nem nướng' },
      en: { name: 'Pate & Grilled Sausage Banh Mi', desc: 'Pate and grilled sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814709/restaurant-app/dishes/u2xamxvpgbxgvvml1hjw.jpg',
      ],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Nem nướng', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì nem nướng ruốc', desc: 'Nem nướng và ruốc' },
      en: { name: 'Grilled Sausage & Floss Banh Mi', desc: 'Grilled sausage and floss' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Nem nướng', quantity: 1 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì trứng chả', desc: 'Trứng ốp và chả' },
      en: { name: 'Egg & Pork Roll Banh Mi', desc: 'Fried egg and pork roll' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 1 }, // 1 quả
        { ingredientName: 'Chả lụa', quantity: 0.03 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì trứng giò', desc: 'Trứng ốp và giò' },
      en: { name: 'Egg & Vietnamese Ham Banh Mi', desc: 'Fried egg and Vietnamese ham' },
      images: [''],
      price: 25000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.03 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì trứng ruốc', desc: 'Trứng và ruốc' },
      en: { name: 'Egg & Floss Banh Mi', desc: 'Fried egg and floss' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì trứng bò khô', desc: 'Trứng và bò khô' },
      en: { name: 'Egg & Beef Jerky Banh Mi', desc: 'Egg and beef jerky' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Bò khô', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì trứng xúc xích', desc: 'Trứng và xúc xích' },
      en: { name: 'Egg & Sausage Banh Mi', desc: 'Egg and sausage' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì 2 trứng', desc: 'Hai trứng ốp la' },
      en: { name: 'Double Egg Banh Mi', desc: 'Two fried eggs' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 2 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate trứng', desc: 'Pate và trứng' },
      en: { name: 'Pate & Egg Banh Mi', desc: 'Pate and egg' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814656/restaurant-app/dishes/ktg0ojt5rpq2cl1xcmlm.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate xúc xích', desc: 'Pate và xúc xích' },
      en: { name: 'Pate & Sausage Banh Mi', desc: 'Pate and sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814550/restaurant-app/dishes/kmpjcl9vucw336twrjyj.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì xúc xích ruốc', desc: 'Xúc xích và ruốc' },
      en: { name: 'Sausage & Floss Banh Mi', desc: 'Sausage and floss' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì xúc xích bò khô', desc: 'Xúc xích và bò khô' },
      en: { name: 'Sausage & Beef Jerky Banh Mi', desc: 'Sausage and beef jerky' },
      images: [''],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Bò khô', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate lạp xưởng', desc: 'Pate và lạp xưởng' },
      en: { name: 'Pate & Chinese Sausage Banh Mi', desc: 'Pate and chinese sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770814335/restaurant-app/dishes/g9nbh5b2oakg0leuhrob.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Lạp xưởng', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate', desc: 'Sốt pate đặc biệt' },
      en: { name: 'Pate Banh Mi', desc: 'Special pate' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770810580/Screenshot_2026-02-08_203316_qkihfi.png',
      ],
      price: 15000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.05 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì bò khô', desc: 'Nhân bò khô' },
      en: { name: 'Beef Jerky Banh Mi', desc: 'Beef jerky' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Bò khô', quantity: 0.03 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì ruốc', desc: 'Nhân ruốc' },
      en: { name: 'Floss Banh Mi', desc: 'Meat floss' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Ruốc thịt', quantity: 0.03 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì xúc xích', desc: 'Nhân xúc xích' },
      images: [''],
      en: { name: 'Sausage Banh Mi', desc: 'Sausage' },
      price: 15000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì 1 trứng', desc: 'Một trứng ốp la' },
      en: { name: 'Single Egg Banh Mi', desc: 'One fried egg' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate ruốc', desc: 'Pate và ruốc' },
      en: { name: 'Pate & Floss Banh Mi', desc: 'Pate and floss' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770818832/restaurant-app/dishes/oshk7lyn8unoyetvcuza.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua (Cà rốt & củ cải)', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì pate bò khô', desc: 'Pate và bò khô' },
      en: { name: 'Pate & Beef Jerky Banh Mi', desc: 'Pate and beef jerky' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819011/restaurant-app/dishes/u5fjwdaemq5tkyxh8fth.jpg',
      ],
      price: 20000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Bò khô', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì bơ sữa', desc: 'Ngọt ngào bơ sữa' },
      en: { name: 'Butter & Milk Banh Mi', desc: 'Butter and condensed milk' },
      images: [''],
      price: 15000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Bơ', quantity: 0.02 },
        { ingredientName: 'Sữa đặc', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh mì thập cẩm', desc: 'Tổng hợp các loại nhân' },
      images: [''],
      en: { name: 'Mixed Banh Mi', desc: 'Fully loaded' },
      price: 30000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.03 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Bò khô', quantity: 0.02 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì đặc biệt', desc: 'Phần nhân siêu đầy đặn' },
      images: [''],
      en: { name: 'Special Banh Mi', desc: 'Super loaded' },
      price: 40000,
      catId: banhMiCat.id,
      recipe: [
        { ingredientName: 'Bánh mì (Vỏ)', quantity: 1 },
        { ingredientName: 'Pate', quantity: 0.05 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.03 },
        { ingredientName: 'Bò khô', quantity: 0.03 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
        { ingredientName: 'Dưa chuột', quantity: 0.02 },
        { ingredientName: 'Đồ chua', quantity: 0.02 },
        { ingredientName: 'Bơ', quantity: 0.01 },
        { ingredientName: 'Nước sốt (Bánh mì)', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Bánh mì không', desc: 'Bánh mì giòn tan' },
      en: { name: 'Plain Banh Mi', desc: 'Crispy baguette' },
      images: [''],
      price: 5000,
      catId: banhMiCat.id,
      recipe: [{ ingredientName: 'Bánh mì (Vỏ)', quantity: 1 }],
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
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 }, // 150g
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi pate trứng', desc: 'Xôi pate trứng' },
      en: { name: 'Pate & Egg Sticky Rice', desc: 'Pate and egg' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819595/restaurant-app/dishes/mlhaxymasbrgmhl3vjmb.jpg',
      ],
      price: 20000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi pate xúc xích', desc: 'Xôi pate xúc xích' },
      en: { name: 'Pate & Sausage Sticky Rice', desc: 'Pate and sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770819897/restaurant-app/dishes/tbktqmlpcicrt5lo4fmp.jpg',
      ],
      price: 20000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi trứng xúc xích', desc: 'Xôi trứng xúc xích' },
      en: { name: 'Egg & Sausage Sticky Rice', desc: 'Egg and sausage' },
      images: [''],
      price: 20000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi trứng ruốc', desc: 'Xôi trứng ruốc' },
      en: { name: 'Egg & Floss Sticky Rice', desc: 'Egg and floss' },
      images: [''],
      price: 20000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi 2 trứng', desc: 'Xôi với 2 trứng' },
      en: { name: 'Double Egg Sticky Rice', desc: 'Sticky rice with 2 eggs' },
      images: [''],
      price: 20000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Trứng', quantity: 2 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi trứng chả', desc: 'Xôi trứng chả' },
      en: { name: 'Egg & Pork Roll Sticky Rice', desc: 'Egg and pork roll' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi trứng giò', desc: 'Xôi trứng giò' },
      en: { name: 'Egg & Vietnamese Ham Sticky Rice', desc: 'Egg and Vietnamese ham' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi pate chả', desc: 'Xôi pate chả' },
      en: { name: 'Pate & Pork Roll Sticky Rice', desc: 'Pate and pork roll' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi pate giò', desc: 'Xôi pate giò' },
      en: { name: 'Pate & Vietnamese Ham Sticky Rice', desc: 'Pate and Vietnamese ham' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi chả ruốc', desc: 'Xôi chả ruốc' },
      en: { name: 'Pork Roll & Floss Sticky Rice', desc: 'Pork roll and floss' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi giò ruốc', desc: 'Xôi giò ruốc' },
      en: { name: 'Vietnamese Ham & Floss Sticky Rice', desc: 'Vietnamese ham and floss' },
      images: [''],
      price: 25000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Chả lụa', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi thập cẩm', desc: 'Đầy đủ toping' },
      en: { name: 'Mixed Sticky Rice', desc: 'Mixed toppings' },
      images: [''],
      price: 30000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Trứng', quantity: 1 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.03 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Xôi thập cẩm trứng', desc: 'Thập cẩm thêm trứng' },
      en: { name: 'Mixed Sticky Rice with Egg', desc: 'Mixed toppings with egg' },
      images: [''],
      price: 35000,
      catId: xoiCat.id,
      recipe: [
        { ingredientName: 'Gạo nếp', quantity: 0.15 },
        { ingredientName: 'Pate', quantity: 0.03 },
        { ingredientName: 'Trứng', quantity: 2 },
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Chả lụa', quantity: 0.03 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
        { ingredientName: 'Hành phi', quantity: 0.01 },
      ],
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
      recipe: [
        { ingredientName: 'Nem nướng', quantity: 2 },
        { ingredientName: 'Dưa chuột', quantity: 0.1 },
        { ingredientName: 'Rau mùi', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Nem nướng suất lớn', desc: 'Suất lớn đầy đặn' },
      en: { name: 'Grilled Sausage (Large)', desc: 'Large portion' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000788/restaurant-app/dishes/ecqt9zrntxwrrvbk7njk.jpg',
      ],
      price: 45000,
      catId: nemNuongCat.id,
      recipe: [
        { ingredientName: 'Nem nướng', quantity: 3 },
        { ingredientName: 'Dưa chuột', quantity: 0.15 },
        { ingredientName: 'Rau mùi', quantity: 0.15 },
      ],
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
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Trứng', quantity: 0.5 },
        { ingredientName: 'Sữa tươi', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá sô cô la', desc: 'Nhân chocolate' },
      en: { name: 'Chocolate Taiyaki', desc: 'Chocolate filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Trứng', quantity: 0.5 },
        { ingredientName: 'Sữa tươi', quantity: 0.05 },
        { ingredientName: 'Sốt Chocolate', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá trà xanh', desc: 'Nhân trà xanh' },
      en: { name: 'Matcha Taiyaki', desc: 'Matcha filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Trứng', quantity: 0.5 },
        { ingredientName: 'Sữa tươi', quantity: 0.05 },
        { ingredientName: 'Sốt Trà xanh', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá phomai kéo sợi', desc: 'Phomai mozzarella' },
      en: { name: 'Cheese Taiyaki', desc: 'Mozzarella cheese' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Trứng', quantity: 0.5 },
        { ingredientName: 'Sữa tươi', quantity: 0.05 },
        { ingredientName: 'Phô mai sợi', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá pate', desc: 'Nhân pate' },
      en: { name: 'Pate Taiyaki', desc: 'Pate filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Pate', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá xúc xích', desc: 'Nhân xúc xích' },
      en: { name: 'Sausage Taiyaki', desc: 'Sausage filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Xúc xích', quantity: 0.5 },
      ],
    },
    {
      vi: { name: 'Bánh cá bò khô', desc: 'Nhân bò khô' },
      en: { name: 'Beef Jerky Taiyaki', desc: 'Beef jerky filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Bò khô', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá ruốc', desc: 'Nhân ruốc' },
      en: { name: 'Floss Taiyaki', desc: 'Floss filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Ruốc thịt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá ngô', desc: 'Nhân ngô' },
      en: { name: 'Corn Taiyaki', desc: 'Corn filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Bắp hạt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá sốt dâu', desc: 'Sốt dâu' },
      en: { name: 'Strawberry Taiyaki', desc: 'Strawberry sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Siro Dâu', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá sốt việt quất', desc: 'Sốt việt quất' },
      en: { name: 'Blueberry Taiyaki', desc: 'Blueberry sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Siro Việt Quất', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá sốt xoài', desc: 'Sốt xoài' },
      en: { name: 'Mango Taiyaki', desc: 'Mango sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Siro Xoài', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá sốt đào', desc: 'Sốt đào' },
      en: { name: 'Peach Taiyaki', desc: 'Peach sauce' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 10000,
      catId: banhCaCat.id,
      recipe: [
        { ingredientName: 'Bột mì', quantity: 0.05 },
        { ingredientName: 'Siro Đào', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Bánh cá không nhân', desc: 'Vỏ giòn' },
      en: { name: 'Plain Taiyaki', desc: 'No filling' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1771000094/restaurant-app/dishes/txuxtbttlhsrydhujcer.jpg',
      ],
      price: 7000,
      catId: banhCaCat.id,
      recipe: [{ ingredientName: 'Bột mì', quantity: 0.05 }],
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
      recipe: [
        { ingredientName: 'Bỏng ngô (nguyên liệu)', quantity: 0.1 },
        { ingredientName: 'Bơ', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Nem chua rán', desc: 'Nem chua rán Hà Nội' },
      en: { name: 'Fried Fermented Pork', desc: 'Fried sour pork' },
      images: [''],
      price: 25000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Nem chua', quantity: 5 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Khoai lang kén', desc: 'Khoai lang kén vàng ươm' },
      en: { name: 'Sweet Potato Cocoons', desc: 'Fried sweet potato' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999931/restaurant-app/dishes/jtmcfqcglesuqfni1ufj.jpg',
      ],
      price: 25000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Khoai lang', quantity: 0.2 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Khoai tây rán', desc: 'Khoai tây chiên' },
      en: { name: 'French Fries', desc: 'Fried potato' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999843/restaurant-app/dishes/agm4yb1x0ioajgkuylps.jpg',
      ],
      price: 20000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Khoai tây', quantity: 0.2 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Cá viên chiên', desc: 'Cá viên chiên' },
      en: { name: 'Fried Fish Balls', desc: 'Fish balls' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999426/restaurant-app/dishes/r9hat4onkgrph6ykamsm.jpg',
      ],
      price: 20000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Cá viên', quantity: 10 },
        { ingredientName: 'Tương ớt', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Xúc xích', desc: 'Xúc xích chiên' },
      en: { name: 'Fried Sausage', desc: 'Sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999197/restaurant-app/dishes/jalybe4aqft1muwmclke.jpg',
      ],
      price: 10000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Xúc xích', quantity: 1 },
        { ingredientName: 'Tương ớt', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Lạp xưởng', desc: 'Lạp xưởng tươi' },
      en: { name: 'Chinese Sausage', desc: 'Chinese sausage' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999139/restaurant-app/dishes/jvpa3vdjfqmj64njvuv5.jpg',
      ],
      price: 10000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Lạp xưởng', quantity: 1 },
        { ingredientName: 'Tương ớt', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Hướng dương mộc', desc: 'Hạt hướng dương' },
      en: { name: 'Sunflower Seeds', desc: 'Sunflower seeds' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999519/restaurant-app/dishes/tqklnn9dhgfemkzuxobg.jpg',
      ],
      price: 10000,
      catId: snackCat.id,
      recipe: [{ ingredientName: 'Hạt hướng dương', quantity: 0.05 }],
    },
    {
      vi: { name: 'Bò khô vắt tắc', desc: 'Bò khô chanh' },
      en: { name: 'Beef Jerky w/ Lime', desc: 'Beef jerky with lime' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770999581/restaurant-app/dishes/wnvueyu04fvxesdjp1np.jpg',
      ],
      price: 15000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Bò khô', quantity: 0.05 },
        { ingredientName: 'Chanh', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Kem cốc', desc: 'Kem mát lạnh' },
      en: { name: 'Ice Cream Cup', desc: 'Ice cream' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770998988/restaurant-app/dishes/brf4gpubslmgevn5xur4.jpg',
      ],
      price: 5000,
      catId: snackCat.id,
      recipe: [{ ingredientName: 'Kem', quantity: 1 }],
    },

    // --- ĐỒ UỐNG (Giữ lại mẫu) ---
    {
      vi: { name: 'Trà chanh', desc: 'Trà chanh tươi mát' },
      en: { name: 'Lime Tea', desc: 'Fresh lime tea' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 15000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà chanh (gói)', quantity: 1 },
        { ingredientName: 'Chanh', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà sen vàng', desc: 'Trà sen vàng thượng hạng' },
      en: { name: 'Golden Lotus Tea', desc: 'Premium lotus tea' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 35000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà ô long', quantity: 1 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà đào cam sả', desc: 'Trà đào cam sả tươi mát' },
      en: { name: 'Peach Orange Lemongrass Tea', desc: 'Refreshing peach tea' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 35000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà đào (túi lọc)', quantity: 1 },
        { ingredientName: 'Đào ngâm', quantity: 0.05 },
        { ingredientName: 'Siro Đào', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà nhài nha đam', desc: 'Trà nhài thơm mát kèm nha đam' },
      en: { name: 'Jasmine Aloe Vera Tea', desc: 'Jasmine tea with aloe vera' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 30000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà nhài', quantity: 1 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà sữa trân châu', desc: 'Trà sữa truyền thống' },
      en: { name: 'Boba Milk Tea', desc: 'Traditional milk tea' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 30000,
      catId: traSuaCat.id,
      recipe: [
        { ingredientName: 'Trà ô long', quantity: 1 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 }, // 100ml
        { ingredientName: 'Trân châu đen', quantity: 0.05 }, // 50g
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà sữa matcha', desc: 'Trà sữa vị matcha' },
      en: { name: 'Matcha Milk Tea', desc: 'Matcha flavored milk tea' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828534/restaurant-app/dishes/cts37hpxw3wrnh9mj69d.jpg',
      ],
      price: 35000,
      catId: traSuaCat.id,
      recipe: [
        { ingredientName: 'Trà nhài', quantity: 1 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Sốt Trà xanh', quantity: 0.03 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Cafe đen đá', desc: 'Cà phê nguyên chất' },
      en: { name: 'Iced Black Coffee', desc: 'Pure black coffee' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828480/restaurant-app/dishes/utpftxpwkiyd92pgz4oc.jpg',
      ],
      price: 20000,
      catId: cafeCat.id,
      recipe: [
        { ingredientName: 'Cafe', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Cafe sữa đá', desc: 'Cà phê sữa đá pha phin' },
      en: { name: 'Iced Milk Coffee', desc: 'Vietnamese milk coffee' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828480/restaurant-app/dishes/utpftxpwkiyd92pgz4oc.jpg',
      ],
      price: 25000,
      catId: cafeCat.id,
      recipe: [
        { ingredientName: 'Cafe', quantity: 0.02 },
        { ingredientName: 'Sữa đặc', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Bạc xỉu', desc: 'Bạc xỉu nóng/đá' },
      en: { name: 'Bac Xiu', desc: 'White coffee' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770828480/restaurant-app/dishes/utpftxpwkiyd92pgz4oc.jpg',
      ],
      price: 25000,
      catId: cafeCat.id,
      recipe: [
        { ingredientName: 'Cafe', quantity: 0.01 },
        { ingredientName: 'Sữa tươi', quantity: 0.05 },
        { ingredientName: 'Sữa đặc', quantity: 0.05 },
      ],
    },

    // Thêm các loại Kem vào category Ăn Vặt (hoặc riêng nếu có Desserts)
    {
      vi: { name: 'Kem Vani', desc: 'Kem vani truyền thống' },
      en: { name: 'Vanilla Ice Cream', desc: 'Classic vanilla' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770998988/restaurant-app/dishes/brf4gpubslmgevn5xur4.jpg',
      ],
      price: 15000,
      catId: snackCat.id, // Dùng tạm snackCat
      recipe: [
        { ingredientName: 'Kem Vani', quantity: 0.1 }, // 100g
      ],
    },
    {
      vi: { name: 'Kem Chocolate', desc: 'Kem sô-cô-la đen' },
      en: { name: 'Chocolate Ice Cream', desc: 'Dark chocolate' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770998988/restaurant-app/dishes/brf4gpubslmgevn5xur4.jpg',
      ],
      price: 15000,
      catId: snackCat.id,
      recipe: [{ ingredientName: 'Kem Chocolate', quantity: 0.1 }],
    },
    {
      vi: { name: 'Kem Dâu', desc: 'Kem chua ngọt vị dâu tây' },
      en: { name: 'Strawberry Ice Cream', desc: 'Strawberry flavor' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770998988/restaurant-app/dishes/brf4gpubslmgevn5xur4.jpg',
      ],
      price: 15000,
      catId: snackCat.id,
      recipe: [
        { ingredientName: 'Kem Dâu', quantity: 0.1 },
        { ingredientName: 'Siro Dâu', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Kem Matcha', desc: 'Kem vị trà xanh' },
      en: { name: 'Matcha Ice Cream', desc: 'Matcha flavor' },
      images: [
        'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770998988/restaurant-app/dishes/brf4gpubslmgevn5xur4.jpg',
      ],
      price: 18000,
      catId: snackCat.id,
      recipe: [{ ingredientName: 'Kem Matcha', quantity: 0.1 }],
    },

    // --- CHÈ ---
    {
      vi: { name: 'Chè bưởi', desc: 'Chè bưởi An Giang cùi giòn, đỗ bùi' },
      en: { name: 'Pomelo Sweet Soup', desc: 'Traditional pomelo sweet soup' },
      images: [''],
      price: 20000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Cùi bưởi (đã chế biến)', quantity: 0.1 }, // 100g
        { ingredientName: 'Đậu xanh', quantity: 0.05 }, // 50g
        { ingredientName: 'Cốt dừa', quantity: 0.05 }, // 50g
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Chè bưởi caramen', desc: 'Chè bưởi kèm bánh flan' },
      en: { name: 'Pomelo Sweet Soup with Flan', desc: 'Pomelo soup with caramel' },
      images: [''],
      price: 25000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Cùi bưởi (đã chế biến)', quantity: 0.1 },
        { ingredientName: 'Đậu xanh', quantity: 0.05 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Chè thái bưởi', desc: 'Chè bưởi kết hợp sợi thái' },
      en: { name: 'Pomelo & Cendol Sweet Soup', desc: 'Pomelo soup with Thai cendol' },
      images: [''],
      price: 25000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Cùi bưởi (đã chế biến)', quantity: 0.05 },
        { ingredientName: 'Sợi Thái (Cendol)', quantity: 0.05 },
        { ingredientName: 'Đậu xanh', quantity: 0.03 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Chè thái bưởi caramen', desc: 'Chè thái bưởi kèm caramen' },
      en: { name: 'Pomelo & Cendol with Flan', desc: 'Thai pomelo soup with flan' },
      images: [''],
      price: 30000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Cùi bưởi (đã chế biến)', quantity: 0.05 },
        { ingredientName: 'Sợi Thái (Cendol)', quantity: 0.05 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Chè thập cẩm caramen', desc: 'Chè thập cẩm các loại topping kèm caramen' },
      en: { name: 'Mixed Sweet Soup with Flan', desc: 'Mixed soup with caramel' },
      images: [''],
      price: 30000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Cùi bưởi (đã chế biến)', quantity: 0.03 },
        { ingredientName: 'Đậu xanh', quantity: 0.03 },
        { ingredientName: 'Thạch sương sáo', quantity: 0.03 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Chè sương sáo', desc: 'Thạch sương sáo thanh mát' },
      en: { name: 'Grass Jelly Sweet Soup', desc: 'Refreshing grass jelly' },
      images: [''],
      price: 15000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Thạch sương sáo', quantity: 0.15 }, // 150g
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Chè sương sáo caramen', desc: 'Thạch sương sáo kèm caramen' },
      en: { name: 'Grass Jelly with Flan', desc: 'Grass jelly and caramel' },
      images: [''],
      price: 20000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Thạch sương sáo', quantity: 0.1 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Chè thạch trân châu', desc: 'Thạch và trân châu dai giòn' },
      en: { name: 'Jelly & Boba Sweet Soup', desc: 'Jelly and pearls' },
      images: [''],
      price: 20000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Thạch sương sáo', quantity: 0.05 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Chè thạch caramen trân châu', desc: 'Thạch trân châu kèm caramen' },
      en: { name: 'Jelly & Boba with Flan', desc: 'Jelly pearls with flan' },
      images: [''],
      price: 25000,
      catId: cheCat.id,
      recipe: [
        { ingredientName: 'Thạch sương sáo', quantity: 0.05 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },

    // --- TÀU HŨ ---
    {
      vi: {
        name: 'Tàu hũ nha đam trân châu cốt dừa',
        desc: 'Tàu hũ mềm mịn kèm nha đam và trân châu',
      },
      en: { name: 'Tofu Pudding with Aloe Vera & Boba', desc: 'Tofu with aloe vera and pearls' },
      images: [''],
      price: 20000,
      catId: tauHuCat.id,
      recipe: [
        { ingredientName: 'Nha đam', quantity: 0.05 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: {
        name: 'Tàu hũ Milo trân châu đường đen cốt dừa',
        desc: 'Tàu hũ Milo đậm đà kèm trân châu',
      },
      en: { name: 'Milo Tofu Pudding with Boba', desc: 'Milo tofu with brown sugar pearls' },
      images: [''],
      price: 20000,
      catId: tauHuCat.id,
      recipe: [
        { ingredientName: 'Bột Milo', quantity: 0.02 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Tàu hũ caramen trân châu cốt dừa', desc: 'Tàu hũ caramen béo ngậy' },
      en: { name: 'Caramel Tofu Pudding with Boba', desc: 'Tofu with flan and pearls' },
      images: [''],
      price: 25000,
      catId: tauHuCat.id,
      recipe: [
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Tàu hũ hoa quả trân châu cốt dừa', desc: 'Tàu hũ mix hoa quả tươi' },
      en: { name: 'Fruit Tofu Pudding with Boba', desc: 'Tofu with mixed fruits' },
      images: [''],
      price: 25000,
      catId: tauHuCat.id,
      recipe: [
        { ingredientName: 'Hoa quả (Mix)', quantity: 0.05 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: {
        name: 'Tàu hũ hoa quả caramen trân châu cốt dừa',
        desc: 'Tàu hũ đặc biệt đầy đủ topping',
      },
      en: { name: 'Special Mixed Tofu Pudding', desc: 'Tofu with fruits, flan and pearls' },
      images: [''],
      price: 30000,
      catId: tauHuCat.id,
      recipe: [
        { ingredientName: 'Hoa quả (Mix)', quantity: 0.05 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Tàu hũ cốt dừa hộp mini', desc: 'Tàu hũ mini tiện lợi' },
      en: { name: 'Mini Tofu Pudding', desc: 'Small serving tofu' },
      images: [''],
      price: 5000,
      catId: tauHuCat.id,
      recipe: [{ ingredientName: 'Cốt dừa', quantity: 0.03 }],
    },

    // --- SỮA CHUA & CARAMEN ---
    {
      vi: { name: 'Sữa chua đánh đá', desc: 'Sữa chua kết hợp đá bào giải nhiệt' },
      en: { name: 'Iced Yogurt', desc: 'Refreshing yogurt with crushed ice' },
      images: [''],
      price: 15000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
        { ingredientName: 'Sữa đặc', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Sữa chua trân châu đánh đá', desc: 'Sữa chua đánh đá kèm trân châu đen' },
      en: { name: 'Iced Yogurt with Boba', desc: 'Iced yogurt with pearls' },
      images: [''],
      price: 20000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Sữa chua nha đam đánh đá', desc: 'Sữa chua đánh đá kèm nha đam' },
      en: { name: 'Iced Yogurt with Aloe Vera', desc: 'Iced yogurt with aloe vera' },
      images: [''],
      price: 20000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Nha đam', quantity: 0.05 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Sữa chua trân châu nha đam', desc: 'Sữa chua mix trân châu và nha đam' },
      en: { name: 'Yogurt with Boba & Aloe Vera', desc: 'Yogurt with pearls and aloe vera' },
      images: [''],
      price: 25000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Nha đam', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Sữa chua trân châu caramen', desc: 'Sữa chua mix trân châu và caramen' },
      en: { name: 'Yogurt with Boba & Flan', desc: 'Yogurt with pearls and caramel' },
      images: [''],
      price: 25000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
      ],
    },
    {
      vi: { name: 'Sữa chua trân châu hoa quả', desc: 'Sữa chua mix trân châu và hoa quả' },
      en: { name: 'Yogurt with Boba & Fruit', desc: 'Yogurt with pearls and mixed fruits' },
      images: [''],
      price: 25000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Hoa quả (Mix)', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Sữa chua caramen hoa quả', desc: 'Sữa chua đặc biệt đầy đủ topping' },
      en: { name: 'Special Mixed Yogurt', desc: 'Yogurt with flan and fruits' },
      images: [''],
      price: 30000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Caramen (Bánh flan)', quantity: 1 },
        { ingredientName: 'Hoa quả (Mix)', quantity: 0.05 },
      ],
    },
    {
      vi: { name: 'Sữa chua lắc vị Việt quất', desc: 'Sữa chua lắc vị việt quất tươi mát' },
      en: { name: 'Blueberry Yogurt Shake', desc: 'Blueberry flavored yogurt shake' },
      images: [''],
      price: 20000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Siro Việt Quất', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Sữa chua lắc vị Dâu', desc: 'Sữa chua lắc vị dâu tây' },
      en: { name: 'Strawberry Yogurt Shake', desc: 'Strawberry flavored yogurt shake' },
      images: [''],
      price: 20000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Siro Dâu', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Sữa chua lắc vị Xoài', desc: 'Sữa chua lắc vị xoài' },
      en: { name: 'Mango Yogurt Shake', desc: 'Mango flavored yogurt shake' },
      images: [''],
      price: 20000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Siro Xoài', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Sữa chua lắc vị Đào', desc: 'Sữa chua lắc vị đào' },
      en: { name: 'Peach Yogurt Shake', desc: 'Peach flavored yogurt shake' },
      images: [''],
      price: 20000,
      catId: suaChuaCat.id,
      recipe: [
        { ingredientName: 'Sữa chua (hũ)', quantity: 1 },
        { ingredientName: 'Siro Đào', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Caramen hộp', desc: 'Bánh flan caramen đóng hộp' },
      en: { name: 'Caramel Flan Box', desc: 'Boxed caramel flan' },
      images: [''],
      price: 7000,
      catId: suaChuaCat.id,
      recipe: [{ ingredientName: 'Caramen (Bánh flan)', quantity: 1 }],
    },

    // --- TRÀ (FRUIT TEAS) ---
    {
      vi: {
        name: 'Trà chanh nha đam/con cá',
        desc: 'Trà chanh mát lạnh kèm nha đam hoặc thạch con cá',
      },
      en: { name: 'Iced Lemon Tea with Aloe/Jelly', desc: 'Lemon tea with toppings' },
      images: [''],
      price: 25000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà chanh (gói)', quantity: 1 },
        { ingredientName: 'Nha đam', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà tắc', desc: 'Trà tắc truyền thống thơm mát' },
      en: { name: 'Kumquat Tea', desc: 'Traditional kumquat tea' },
      images: [''],
      price: 15000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Quả tắc (Quất)', quantity: 0.03 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà tắc nha đam/con cá', desc: 'Trà tắc kèm topping nha đam hoặc thạch' },
      en: { name: 'Kumquat Tea with Aloe/Jelly', desc: 'Kumquat tea with toppings' },
      images: [''],
      price: 25000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Quả tắc (Quất)', quantity: 0.03 },
        { ingredientName: 'Nha đam', quantity: 0.05 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà đào nha đam', desc: 'Trà đào thơm nồng kèm nha đam giòn sần sật' },
      en: { name: 'Peach Tea with Aloe Vera', desc: 'Peach tea with aloe topping' },
      images: [''],
      price: 30000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà đào (túi lọc)', quantity: 1 },
        { ingredientName: 'Đào ngâm', quantity: 0.05 },
        { ingredientName: 'Nha đam', quantity: 0.05 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà hoa quả nhiệt đới', desc: 'Tổng hợp các loại hoa quả tươi mát' },
      en: { name: 'Tropical Fruit Tea', desc: 'Mixed fresh fruit tea' },
      images: [''],
      price: 35000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Hoa quả (Mix)', quantity: 0.08 },
        { ingredientName: 'Chanh leo', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà xoài chanh leo', desc: 'Sự kết hợp giữa xoài và chanh leo' },
      en: { name: 'Mango Passion Fruit Tea', desc: 'Mango and passion fruit blend' },
      images: [''],
      price: 30000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Siro Xoài', quantity: 0.02 },
        { ingredientName: 'Chanh leo', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà táo đỏ long nhãn', desc: 'Trà thảo mộc thanh lọc cơ thể' },
      en: { name: 'Red Date & Longan Tea', desc: 'Herbal tea with dates and longan' },
      images: [''],
      price: 30000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Táo đỏ', quantity: 0.02 },
        { ingredientName: 'Long nhãn', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.01 },
      ],
    },
    {
      vi: { name: 'Trà mãng cầu', desc: 'Trà mãng cầu xiêm tươi mới' },
      en: { name: 'Soursop Tea', desc: 'Fresh soursop tea' },
      images: [''],
      price: 30000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Mãng cầu tươi', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.03 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Hồng trà kem cheese', desc: 'Hồng trà đậm vị kèm lớp kem cheese béo ngậy' },
      en: { name: 'Black Tea with Cream Cheese', desc: 'Black tea with cheese foam' },
      images: [''],
      price: 35000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Kem cheese (Milkfoam)', quantity: 0.05 },
        { ingredientName: 'Sữa đặc', quantity: 0.01 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Trà xanh kem cheese', desc: 'Trà xanh thanh mát kèm kem cheese' },
      en: { name: 'Green Tea with Cream Cheese', desc: 'Green tea with cheese foam' },
      images: [''],
      price: 35000,
      catId: traCat.id,
      recipe: [
        { ingredientName: 'Trà nhài', quantity: 1 },
        { ingredientName: 'Kem cheese (Milkfoam)', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },

    // --- TRÀ SỮA (MILK TEAS) ---
    {
      vi: { name: 'Trà sữa trân châu', desc: 'Trà sữa truyền thống với các loại trân châu' },
      en: { name: 'Pearl Milk Tea', desc: 'Classic milk tea with pearl options' },
      images: [''],
      price: 25000,
      catId: traSuaCat.id,
      variants: [
        {
          name: 'Topping',
          options: [
            { value: 'Trân châu đen', price: 0 },
            { value: 'Trân châu trắng', price: 3000 },
            { value: 'Trân châu đường đen', price: 5000 },
          ],
        },
      ],
      recipe: [
        { ingredientName: 'Trà ô long', quantity: 1 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà sữa các vị', desc: 'Trà sữa với nhiều lựa chọn hương vị trái cây và hạt' },
      en: { name: 'Flavored Milk Tea', desc: 'Milk tea with various flavor options' },
      images: [''],
      price: 30000,
      catId: traSuaCat.id,
      variants: [
        {
          name: 'Hương vị',
          options: [
            { value: 'Xoài', price: 0 },
            { value: 'Dâu', price: 0 },
            { value: 'Việt quất', price: 0 },
            { value: 'Bạc hà', price: 0 },
            { value: 'Hạt dẻ', price: 0 },
            { value: 'Đào', price: 0 },
            { value: 'Socola', price: 0 },
          ],
        },
      ],
      recipe: [
        { ingredientName: 'Trà nhài', quantity: 1 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },

    // --- SỮA TƯƠI (FRESH MILK) ---
    {
      vi: {
        name: 'Sữa tươi trân châu đường đen',
        desc: 'Sữa tươi kết hợp vị ngọt của trân châu đường đen',
      },
      en: { name: 'Brown Sugar Pearl Fresh Milk', desc: 'Fresh milk with brown sugar boba' },
      images: [''],
      price: 35000,
      catId: suaTuoiCat.id,
      recipe: [
        { ingredientName: 'Sữa tươi', quantity: 0.15 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Đường đen (siro)', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Matcha trân châu đường đen', desc: 'Sữa tươi trà xanh với trân châu đường đen' },
      en: {
        name: 'Matcha Brown Sugar Pearl Fresh Milk',
        desc: 'Matcha and fresh milk with brown sugar boba',
      },
      images: [''],
      price: 35000,
      catId: suaTuoiCat.id,
      recipe: [
        { ingredientName: 'Sữa tươi', quantity: 0.15 },
        { ingredientName: 'Sốt Trà xanh', quantity: 0.02 },
        { ingredientName: 'Trân châu đen', quantity: 0.05 },
        { ingredientName: 'Đường đen (siro)', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Matcha latte', desc: 'Sữa tươi trà xanh thơm mát' },
      en: { name: 'Matcha Latte', desc: 'Matcha with fresh milk' },
      images: [''],
      price: 30000,
      catId: suaTuoiCat.id,
      recipe: [
        { ingredientName: 'Sữa tươi', quantity: 0.15 },
        { ingredientName: 'Sốt Trà xanh', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Cacao latte', desc: 'Sữa tươi cacao đậm đà' },
      en: { name: 'Cacao Latte', desc: 'Cacao with fresh milk' },
      images: [''],
      price: 30000,
      catId: suaTuoiCat.id,
      recipe: [
        { ingredientName: 'Sữa tươi', quantity: 0.15 },
        { ingredientName: 'Sốt Cacao', quantity: 0.03 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Sữa tươi cafe', desc: 'Sữa tươi cafe với nhiều lựa chọn topping' },
      en: { name: 'Fresh Milk Coffee', desc: 'Coffee with fresh milk and toppings' },
      images: [''],
      price: 30000,
      catId: suaTuoiCat.id,
      variants: [
        {
          name: 'Topping',
          options: [
            { value: 'Sương sáo', price: 0 },
            { value: 'Caramel', price: 5000 },
            { value: 'Đường đen', price: 5000 },
          ],
        },
      ],
      recipe: [
        { ingredientName: 'Sữa tươi', quantity: 0.15 },
        { ingredientName: 'Cafe', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },

    // --- CÀ PHÊ (COFFEE) SPECIALTIES ---
    {
      vi: { name: 'Cafe muối', desc: 'Cafe đậm đà kèm lớp kem muối béo mặn' },
      en: { name: 'Salted Coffee', desc: 'Coffee with salted cream foam' },
      images: [''],
      price: 30000,
      catId: cafeCat.id,
      recipe: [
        { ingredientName: 'Cafe', quantity: 0.02 },
        { ingredientName: 'Sữa đặc', quantity: 0.03 },
        { ingredientName: 'Kem cheese (Milkfoam)', quantity: 0.03 },
        { ingredientName: 'Muối (tinh)', quantity: 0.001 }, // 1g
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Cafe cốt dừa', desc: 'Cafe hòa quyện cùng cốt dừa đá xay béo ngậy' },
      en: { name: 'Coconut Coffee', desc: 'Coffee with coconut milk slushie' },
      images: [''],
      price: 35000,
      catId: cafeCat.id,
      recipe: [
        { ingredientName: 'Cafe', quantity: 0.02 },
        { ingredientName: 'Cốt dừa', quantity: 0.05 },
        { ingredientName: 'Sữa đặc', quantity: 0.03 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },

    // --- NƯỚC GIẢI KHÁT (BEVERAGES) ---
    {
      vi: { name: 'Nước chanh tươi', desc: 'Nước chanh tươi nguyên chất mát lạnh' },
      en: { name: 'Fresh Lemonade', desc: 'Fresh squeezed lime juice' },
      images: [''],
      price: 20000,
      catId: drinkCat.id,
      variants: [
        {
          name: 'Topping',
          options: [
            { value: 'Hạt chia', price: 5000 },
            { value: 'Nha đam', price: 5000 },
            { value: 'Con cá', price: 5000 },
          ],
        },
      ],
      recipe: [
        { ingredientName: 'Chanh', quantity: 0.05 },
        { ingredientName: 'Đường', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Nước dừa tươi', desc: 'Nước dừa tươi nguyên quả' },
      en: { name: 'Fresh Coconut Water', desc: 'Fresh coconut water from fruit' },
      images: [''],
      price: 30000,
      catId: drinkCat.id,
      recipe: [{ ingredientName: 'Quả dừa tươi', quantity: 1 }],
    },
    {
      vi: { name: 'Cacao lắc đá', desc: 'Cacao béo ngậy được lắc đều cùng đá' },
      en: { name: 'Shaken Iced Cacao', desc: 'Creamy cacao shaken with ice' },
      images: [''],
      price: 30000,
      catId: drinkCat.id,
      recipe: [
        { ingredientName: 'Sốt Cacao', quantity: 0.03 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Sữa đặc', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Milo lắc đá', desc: 'Sữa Milo lắc đá mát lạnh' },
      en: { name: 'Shaken Iced Milo', desc: 'Milo chocolate drink shaken with ice' },
      images: [''],
      price: 30000,
      catId: drinkCat.id,
      recipe: [
        { ingredientName: 'Bột Milo', quantity: 0.03 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Sữa đặc', quantity: 0.02 },
        { ingredientName: 'Đá viên', quantity: 0.1 },
      ],
    },
    {
      vi: { name: 'Milo đá bào full topping', desc: 'Milo đá bào cực đã với nhiều loại topping' },
      en: { name: 'Full Topping Milo Slushie', desc: 'Shaved ice Milo with various toppings' },
      images: [''],
      price: 35000,
      catId: drinkCat.id,
      recipe: [
        { ingredientName: 'Bột Milo', quantity: 0.05 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Trân châu đen', quantity: 0.03 },
        { ingredientName: 'Thạch cốt dừa', quantity: 0.03 },
        { ingredientName: 'Đá viên', quantity: 0.2 },
      ],
    },
    {
      vi: { name: 'Coca', desc: 'Coca Cola lon 330ml' },
      en: { name: 'Coca Cola', desc: '330ml can of Coca Cola' },
      images: [''],
      price: 15000,
      catId: drinkCat.id,
      recipe: [{ ingredientName: 'Coca lon', quantity: 1 }],
    },
    {
      vi: { name: 'Lavie', desc: 'Nước khoáng Lavie chai 500ml' },
      en: { name: 'Lavie Water', desc: '500ml bottle of Lavie mineral water' },
      images: [''],
      price: 10000,
      catId: drinkCat.id,
      recipe: [{ ingredientName: 'Nước khoáng Lavie', quantity: 1 }],
    },

    // --- ĐỒ UỐNG NÓNG (HOT DRINKS) ---
    {
      vi: { name: 'Sữa đậu nóng', desc: 'Sữa đậu nành nguyên chất đun nóng thơm lừng' },
      en: { name: 'Hot Soy Milk', desc: 'Freshly boiled hot soy milk' },
      images: [''],
      price: 15000,
      catId: hotDrinkCat.id,
      recipe: [{ ingredientName: 'Sữa đậu nành', quantity: 0.2 }], // 200ml
    },
    {
      vi: { name: 'Trà sữa nóng', desc: 'Trà sữa nóng với nhiều lựa chọn hương vị' },
      en: { name: 'Hot Milk Tea', desc: 'Hot milk tea with various flavors' },
      images: [''],
      price: 30000,
      catId: hotDrinkCat.id,
      variants: [
        {
          name: 'Hương vị',
          options: [
            { value: 'Truyền thống', price: 0 },
            { value: 'Xoài', price: 0 },
            { value: 'Dâu', price: 0 },
            { value: 'Việt quất', price: 0 },
            { value: 'Socola', price: 0 },
          ],
        },
      ],
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Sữa tươi', quantity: 0.1 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà gừng nóng', desc: 'Trà gừng ấm áp, tốt cho sức khỏe' },
      en: { name: 'Hot Ginger Tea', desc: 'Warming and healthy ginger tea' },
      images: [''],
      price: 20000,
      catId: hotDrinkCat.id,
      recipe: [
        { ingredientName: 'Gừng tươi', quantity: 0.02 },
        { ingredientName: 'Đường', quantity: 0.02 },
      ],
    },
    {
      vi: { name: 'Trà quất mật ong nóng', desc: 'Trà quất mật ong thanh cổ, ấm bụng' },
      en: { name: 'Hot Kumquat Honey Tea', desc: 'Soothing hot kumquat and honey tea' },
      images: [''],
      price: 25000,
      catId: hotDrinkCat.id,
      recipe: [
        { ingredientName: 'Quả tắc (Quất)', quantity: 0.03 },
        { ingredientName: 'Mật ong', quantity: 0.02 },
      ],
    },
    {
      vi: {
        name: 'Hồng trà táo long nhãn nóng',
        desc: 'Hồng trà táo đỏ long nhãn an thần, dễ ngủ',
      },
      en: {
        name: 'Hot Red Date & Longan Black Tea',
        desc: 'Calming black tea with dates and longan',
      },
      images: [''],
      price: 30000,
      catId: hotDrinkCat.id,
      recipe: [
        { ingredientName: 'Hồng trà (gói)', quantity: 1 },
        { ingredientName: 'Táo đỏ', quantity: 0.02 },
        { ingredientName: 'Long nhãn', quantity: 0.02 },
      ],
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
        const status = isCompleted
          ? OrderStatus.COMPLETED
          : Math.random() > 0.5
            ? OrderStatus.PENDING_CONFIRMATION
            : OrderStatus.CANCELLED

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

        const channelSelect = Math.random() > 0.5 ? Channel.WEB : Channel.POS
        const order = await prisma.order.create({
          data: {
            restaurantId: restaurant.id,
            tableId: channelSelect === Channel.POS ? table.id : null,
            userId: clientUser.id,
            totalAmount: new Prisma.Decimal(totalAmount),
            status: status,
            channel: channelSelect,
            createdAt: createdAt,
            updatedAt: createdAt,
            paymentStatus: isCompleted ? PaymentStatus.PAID : PaymentStatus.PENDING,
            items: {
              create: orderItemsData,
            },
          },
        })

        if (isCompleted) {
          await prisma.paymentTransaction.create({
            data: {
              orderId: order.id,
              gateway: 'CASH',
              amountIn: new Prisma.Decimal(totalAmount),
              transactionContent: `Payment for Order ${order.id}`,
            },
          })
        }

        // Add review for completed orders
        if (status === 'COMPLETED' && Math.random() > 0.6) {
          // Pick a random dish from the order to review
          const randomDishItem = dishesWithTrans.find(
            (d) => d.dishTranslations[0]?.name === orderItemsData[0].dishName,
          )

          if (randomDishItem) {
            const reviewComments = [
              'Ngon quá!',
              'Chất lượng tuyệt vời!',
              'Giao hàng nhanh, đồ ăn nóng hổi.',
              'Pate hơi mặn xíu nhưng tổng thể rất ngon.',
              'Giá hợp lý, sẽ quay lại.',
            ]
            await prisma.review.create({
              data: {
                dishId: randomDishItem.id, // Linked to a specific dish
                userId: clientUser.id, // clientUser creates the review
                content: reviewComments[Math.floor(Math.random() * reviewComments.length)],
                rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                createdAt: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24), // Review 1 day later
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

  // =================================================================================================
  // 12. MOCK MESSAGES
  // =================================================================================================
  console.log('Creating mock messages...')
  const messageCount = await prisma.message.count()
  if (messageCount === 0 && adminUser && clientUser) {
    const now = new Date()
    await prisma.message.createMany({
      data: [
        {
          fromUserId: clientUser.id,
          toUserId: adminUser.id,
          content: 'Chào nhà hàng, cuối tuần này mình muốn đặt bàn cho 10 người được không ạ?',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          fromUserId: adminUser.id,
          toUserId: clientUser.id,
          content:
            'Dạ chào bạn, Bamixo hiện có phòng VIP chứa được 10 người nhé. Bạn dự định đến vào lúc mấy giờ ạ?',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 1), // 1 hour ago
        },
        {
          fromUserId: clientUser.id,
          toUserId: adminUser.id,
          content: 'Mình đến tầm 19:00 tối mai nhé! Có cần cọc trước không?',
          createdAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 mins ago
        },
        {
          fromUserId: clientUser.id,
          toUserId: adminUser.id,
          content: 'Cập nhật lại là mình đi 12 người nhé!',
          createdAt: new Date(now.getTime() - 1000 * 60 * 5), // 5 mins ago
        },
      ],
    })
    console.log('✓ Mock messages created')
  } else {
    console.log('✓ Mock messages skipped')
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
