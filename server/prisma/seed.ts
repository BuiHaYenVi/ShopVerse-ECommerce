import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data in reverse order of dependencies
  await prisma.paymentTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@shopverse.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
      phone: '0987654321',
      address: 'ShopVerse HQ, Ho Chi Minh City, Vietnam',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@shopverse.com',
      password: hashedPassword,
      name: 'Nguyen Van A',
      role: Role.CUSTOMER,
      phone: '0912345678',
      address: '123 Nguyen Trai, District 1, Ho Chi Minh City',
    },
  });

  console.log('✅ Users seeded:', { admin: admin.email, customer: customer.email });

  // 2. Seed Categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Điện tử & Công nghệ',
      slug: 'dien-tu-cong-nghe',
      description: 'Điện thoại, máy tính bảng, laptop và phụ kiện công nghệ cao cấp',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
  });

  const fashion = await prisma.category.create({
    data: {
      name: 'Thời trang nam nữ',
      slug: 'thoi-trang-nam-nu',
      description: 'Quần áo, phụ kiện thời trang hiện đại xu hướng 2026',
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    },
  });

  const homeLiving = await prisma.category.create({
    data: {
      name: 'Nhà cửa & Đời sống',
      slug: 'nha-cua-doi-song',
      description: 'Nội thất, đồ gia dụng thông minh và tiện ích gia đình',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
    },
  });

  console.log('✅ Categories seeded');

  // 3. Seed Products
  const productsData = [
    {
      name: 'Tai nghe Bluetooth chống ồn Sony WH-1000XM5',
      slug: 'tai-nghe-sony-wh-1000xm5',
      description: 'Tai nghe chụp tai chống ồn chủ động hàng đầu, thời lượng pin 30 giờ, âm thanh độ phân giải cao Hi-Res Audio.',
      price: 7990000,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      isFeatured: true,
      categoryId: electronics.id,
    },
    {
      name: 'Bàn phím cơ không dây Keychron K2 Pro QMK/VIA',
      slug: 'ban-phim-co-keychron-k2-pro',
      description: 'Bàn phím cơ layout 75%, hot-swap, kết nối Bluetooth 5.1 và cáp Type-C, keycap PBT double-shot.',
      price: 2450000,
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
      isFeatured: true,
      categoryId: electronics.id,
    },
    {
      name: 'Chuột công thái học Logitech MX Master 3S',
      slug: 'chuot-logitech-mx-master-3s',
      description: 'Chuột không dây chuyên nghiệp với cảm biến 8K DPI, cuộn MagSpeed siêu nhanh và click êm ái Quiet Click.',
      price: 2190000,
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800',
      isFeatured: false,
      categoryId: electronics.id,
    },
    {
      name: 'Áo khoác gió thể thao trượt nước Urban Jacket',
      slug: 'ao-khoac-gio-the-thao-urban-jacket',
      description: 'Chất liệu vải polyester cao cấp chống tia UV, kháng nước nhẹ, thiết kế thoáng khí thời trang.',
      price: 499000,
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      isFeatured: true,
      categoryId: fashion.id,
    },
    {
      name: 'Balo laptop chống trộm đa năng Waterproof 15.6 inch',
      slug: 'balo-laptop-chong-trom-156-inch',
      description: 'Balo chống nước có cổng sạc USB, nhiều ngăn phân chia khoa học, đệm lưng êm ái chống mỏi.',
      price: 650000,
      stock: 90,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      isFeatured: false,
      categoryId: fashion.id,
    },
    {
      name: 'Đèn bàn LED thông minh chống cận thị Smart Desk Lamp',
      slug: 'den-ban-led-thong-minh-smart-desk-lamp',
      description: 'Điều chỉnh nhiệt độ màu 2700K - 6500K, hẹn giờ Pomodoro, điều khiển cảm ứng hoặc qua ứng dụng điện thoại.',
      price: 580000,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      isFeatured: true,
      categoryId: homeLiving.id,
    },
  ];

  for (const item of productsData) {
    await prisma.product.create({ data: item });
  }

  console.log('✅ Products seeded');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
