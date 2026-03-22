import {
  PrismaClient,
  OrderStatus,
  Channel,
  PaymentStatus,
} from '../src/generated/prisma/client'
import envConfig from '../src/shared/config'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = envConfig.DATABASE_URL
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Starting order seeding for the current week...')
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const users = await prisma.user.findMany({ take: 10 });
  const skus = await prisma.sKU.findMany({
    include: { dish: true },
    take: 20
  });

  if (users.length === 0 || skus.length === 0) {
    console.log('No users or SKUs found to create orders.');
    return;
  }

  const statuses = [
    OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.COMPLETED,
    OrderStatus.PENDING_CONFIRMATION, OrderStatus.PREPARING, 
    OrderStatus.DELIVERING, OrderStatus.CANCELLED, OrderStatus.BOOMED
  ];

  const numOfOrdersToCreate = 50;

  for (let i = 0; i < numOfOrdersToCreate; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomDateValue = randomDate(oneWeekAgo, now);
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const numOfItems = Math.floor(Math.random() * 3) + 1;
    let totalAmount = 0;
    const itemsData = [];

    for (let j = 0; j < numOfItems; j++) {
      const randomSku = skus[Math.floor(Math.random() * skus.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = Number(randomSku.price);
      totalAmount += price * quantity;

      itemsData.push({
        dishName: randomSku.dish.images ? 'Dish Name' : 'Dish', // simplification
        price: price,
        quantity: quantity,
        skuValue: randomSku.value,
        skuId: randomSku.id,
        dishId: randomSku.dish.id
      });
    }

    const order = await prisma.order.create({
      data: {
        userId: randomUser.id,
        status: randomStatus,
        channel: Channel.WEB,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: totalAmount,
        createdAt: randomDateValue,
        updatedAt: randomDateValue,
        items: {
          create: itemsData
        }
      }
    });

    console.log(`Created order ${order.id} for user ${randomUser.id} at ${randomDateValue.toISOString()}`);
  }

  console.log('✓ Order seeding complete!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
