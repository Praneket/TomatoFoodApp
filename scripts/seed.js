/**
 * TOMATO PLATFORM - Database Seed Script
 * Run: node scripts/seed.js
 * Seeds: Restaurants, Food Items, Test Users
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('./node_modules/mongoose');

const BASE_URI = process.env.MONGO_URI || 'mongodb://root:rootpassword@localhost:27017/tomato?authSource=admin';
// Build per-db URIs by replacing the db name portion
const makeUri = (db) => BASE_URI.replace(/\/[^\/\?]+(\?|$)/, `/${db}$1`);

// ── SCHEMAS ──────────────────────────────────────────────────
const foodSchema = new mongoose.Schema({
  restaurantId: String, name: String, description: String,
  price: Number, discountPrice: Number, category: String,
  image: String, isVeg: Boolean, isAvailable: Boolean,
  isPopular: Boolean, isTrending: Boolean, tags: [String],
  rating: Number, totalRatings: Number, totalOrders: Number,
  calories: Number, preparationTime: Number,
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
  ownerId: String, name: String, description: String,
  cuisine: [String], category: String, images: [String],
  coverImage: String, logo: String,
  address: { line1: String, city: String, state: String, pincode: String, lat: Number, lng: Number },
  contact: { phone: String, email: String },
  timings: [{ day: String, open: String, close: String, isClosed: Boolean }],
  menu: [{ name: String, description: String, price: Number, category: String, image: String, isVeg: Boolean, isAvailable: Boolean, isPopular: Boolean }],
  rating: Number, totalRatings: Number, deliveryTime: Number,
  minOrder: Number, deliveryFee: Number, freeDeliveryAbove: Number,
  isOpen: Boolean, isVerified: Boolean, isActive: Boolean, isFeatured: Boolean,
  tags: [String], totalOrders: Number,
}, { timestamps: true });

const RESTAURANTS = [
  {
    ownerId: 'seed_owner_1',
    name: 'Spice Garden',
    description: 'Authentic Indian cuisine with rich flavors and aromatic spices',
    cuisine: ['Indian', 'Mughlai'],
    category: 'restaurant',
    coverImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    address: { line1: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', lat: 19.0760, lng: 72.8777 },
    contact: { phone: '+91 9876543210', email: 'spicegarden@example.com' },
    timings: [
      { day: 'mon', open: '11:00', close: '23:00' }, { day: 'tue', open: '11:00', close: '23:00' },
      { day: 'wed', open: '11:00', close: '23:00' }, { day: 'thu', open: '11:00', close: '23:00' },
      { day: 'fri', open: '11:00', close: '23:30' }, { day: 'sat', open: '10:00', close: '23:30' },
      { day: 'sun', open: '10:00', close: '22:00' },
    ],
    menu: [
      { name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 320, category: 'Main Course', isVeg: false, isAvailable: true, isPopular: true },
      { name: 'Paneer Tikka Masala', description: 'Grilled paneer in spiced gravy', price: 280, category: 'Main Course', isVeg: true, isAvailable: true, isPopular: true },
      { name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken', price: 350, category: 'Rice', isVeg: false, isAvailable: true, isPopular: true },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils in butter', price: 220, category: 'Main Course', isVeg: true, isAvailable: true },
      { name: 'Garlic Naan', description: 'Soft bread with garlic and butter', price: 60, category: 'Breads', isVeg: true, isAvailable: true },
      { name: 'Gulab Jamun', description: 'Soft milk dumplings in sugar syrup', price: 120, category: 'Desserts', isVeg: true, isAvailable: true },
    ],
    rating: 4.5, totalRatings: 1250, deliveryTime: 35, minOrder: 200, deliveryFee: 49, freeDeliveryAbove: 500,
    isOpen: true, isVerified: true, isActive: true, isFeatured: true, tags: ['popular', 'spicy', 'north-indian'],
    totalOrders: 8500,
  },
  {
    ownerId: 'seed_owner_2',
    name: 'Pizza Paradise',
    description: 'Wood-fired pizzas with authentic Italian recipes',
    cuisine: ['Italian', 'Continental'],
    category: 'restaurant',
    coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    address: { line1: '45 Linking Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', lat: 19.0596, lng: 72.8295 },
    contact: { phone: '+91 9876543211', email: 'pizzaparadise@example.com' },
    timings: [
      { day: 'mon', open: '12:00', close: '23:00' }, { day: 'tue', open: '12:00', close: '23:00' },
      { day: 'wed', open: '12:00', close: '23:00' }, { day: 'thu', open: '12:00', close: '23:00' },
      { day: 'fri', open: '12:00', close: '00:00' }, { day: 'sat', open: '11:00', close: '00:00' },
      { day: 'sun', open: '11:00', close: '23:00' },
    ],
    menu: [
      { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 299, category: 'Pizza', isVeg: true, isAvailable: true, isPopular: true },
      { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni and cheese', price: 399, category: 'Pizza', isVeg: false, isAvailable: true, isPopular: true },
      { name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce with grilled chicken', price: 449, category: 'Pizza', isVeg: false, isAvailable: true },
      { name: 'Pasta Arrabiata', description: 'Spicy tomato pasta', price: 249, category: 'Pasta', isVeg: true, isAvailable: true },
      { name: 'Garlic Bread', description: 'Crispy garlic bread with herbs', price: 129, category: 'Sides', isVeg: true, isAvailable: true },
      { name: 'Tiramisu', description: 'Classic Italian dessert', price: 199, category: 'Desserts', isVeg: true, isAvailable: true },
    ],
    rating: 4.3, totalRatings: 890, deliveryTime: 30, minOrder: 300, deliveryFee: 49, freeDeliveryAbove: 600,
    isOpen: true, isVerified: true, isActive: true, isFeatured: true, tags: ['pizza', 'italian', 'fast-food'],
    totalOrders: 6200,
  },
  {
    ownerId: 'seed_owner_3',
    name: 'Burger Barn',
    description: 'Juicy gourmet burgers made with fresh ingredients',
    cuisine: ['American', 'Fast Food'],
    category: 'fast_food',
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    address: { line1: '78 FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004', lat: 18.5204, lng: 73.8567 },
    contact: { phone: '+91 9876543212', email: 'burgerbarn@example.com' },
    timings: [
      { day: 'mon', open: '10:00', close: '23:00' }, { day: 'tue', open: '10:00', close: '23:00' },
      { day: 'wed', open: '10:00', close: '23:00' }, { day: 'thu', open: '10:00', close: '23:00' },
      { day: 'fri', open: '10:00', close: '00:00' }, { day: 'sat', open: '10:00', close: '00:00' },
      { day: 'sun', open: '11:00', close: '23:00' },
    ],
    menu: [
      { name: 'Classic Beef Burger', description: 'Juicy beef patty with lettuce, tomato, cheese', price: 249, category: 'Burgers', isVeg: false, isAvailable: true, isPopular: true },
      { name: 'Veggie Delight Burger', description: 'Crispy veggie patty with fresh veggies', price: 199, category: 'Burgers', isVeg: true, isAvailable: true, isPopular: true },
      { name: 'Chicken Crispy Burger', description: 'Crispy fried chicken with coleslaw', price: 229, category: 'Burgers', isVeg: false, isAvailable: true },
      { name: 'Loaded Fries', description: 'Crispy fries with cheese sauce and jalapeños', price: 149, category: 'Sides', isVeg: true, isAvailable: true },
      { name: 'Chocolate Milkshake', description: 'Thick creamy chocolate shake', price: 129, category: 'Beverages', isVeg: true, isAvailable: true },
    ],
    rating: 4.2, totalRatings: 650, deliveryTime: 25, minOrder: 150, deliveryFee: 29, freeDeliveryAbove: 400,
    isOpen: true, isVerified: true, isActive: true, isFeatured: false, tags: ['burgers', 'fast-food', 'american'],
    totalOrders: 4800,
  },
  {
    ownerId: 'seed_owner_4',
    name: 'Sushi Sakura',
    description: 'Authentic Japanese sushi and ramen',
    cuisine: ['Japanese', 'Asian'],
    category: 'restaurant',
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    address: { line1: '12 Koregaon Park', city: 'Pune', state: 'Maharashtra', pincode: '411001', lat: 18.5362, lng: 73.8938 },
    contact: { phone: '+91 9876543213', email: 'sushisakura@example.com' },
    timings: [
      { day: 'mon', open: '12:00', close: '22:00' }, { day: 'tue', open: '12:00', close: '22:00' },
      { day: 'wed', open: '12:00', close: '22:00' }, { day: 'thu', open: '12:00', close: '22:00' },
      { day: 'fri', open: '12:00', close: '23:00' }, { day: 'sat', open: '11:00', close: '23:00' },
      { day: 'sun', open: '11:00', close: '22:00' },
    ],
    menu: [
      { name: 'Salmon Nigiri (6 pcs)', description: 'Fresh salmon on seasoned rice', price: 450, category: 'Sushi', isVeg: false, isAvailable: true, isPopular: true },
      { name: 'California Roll (8 pcs)', description: 'Crab, avocado, cucumber roll', price: 380, category: 'Rolls', isVeg: false, isAvailable: true, isPopular: true },
      { name: 'Vegetable Maki (6 pcs)', description: 'Assorted vegetable rolls', price: 280, category: 'Rolls', isVeg: true, isAvailable: true },
      { name: 'Tonkotsu Ramen', description: 'Rich pork bone broth with noodles', price: 420, category: 'Ramen', isVeg: false, isAvailable: true },
      { name: 'Miso Soup', description: 'Traditional Japanese miso soup', price: 120, category: 'Soups', isVeg: true, isAvailable: true },
      { name: 'Matcha Ice Cream', description: 'Green tea flavored ice cream', price: 180, category: 'Desserts', isVeg: true, isAvailable: true },
    ],
    rating: 4.7, totalRatings: 420, deliveryTime: 40, minOrder: 400, deliveryFee: 79, freeDeliveryAbove: 800,
    isOpen: true, isVerified: true, isActive: true, isFeatured: true, tags: ['sushi', 'japanese', 'premium'],
    totalOrders: 2100,
  },
];

const FOOD_ITEMS = [
  { name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 320, category: 'Main Course', isVeg: false, isPopular: true, isTrending: true, rating: 4.6, totalOrders: 2500, calories: 450, preparationTime: 20, tags: ['spicy', 'creamy', 'chicken'] },
  { name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 280, category: 'Starters', isVeg: true, isPopular: true, isTrending: true, rating: 4.5, totalOrders: 2100, calories: 380, preparationTime: 15, tags: ['veg', 'grilled', 'starter'] },
  { name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken', price: 350, category: 'Rice', isVeg: false, isPopular: true, isTrending: true, rating: 4.7, totalOrders: 3200, calories: 620, preparationTime: 30, tags: ['rice', 'chicken', 'aromatic'] },
  { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 299, category: 'Pizza', isVeg: true, isPopular: true, isTrending: false, rating: 4.4, totalOrders: 1800, calories: 520, preparationTime: 20, tags: ['pizza', 'veg', 'classic'] },
  { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni and cheese', price: 399, category: 'Pizza', isVeg: false, isPopular: true, isTrending: true, rating: 4.5, totalOrders: 2200, calories: 680, preparationTime: 20, tags: ['pizza', 'non-veg', 'cheesy'] },
  { name: 'Classic Burger', description: 'Juicy beef patty with fresh veggies', price: 249, category: 'Burgers', isVeg: false, isPopular: true, isTrending: false, rating: 4.3, totalOrders: 1600, calories: 540, preparationTime: 15, tags: ['burger', 'beef', 'fast-food'] },
  { name: 'Veggie Burger', description: 'Crispy veggie patty with coleslaw', price: 199, category: 'Burgers', isVeg: true, isPopular: false, isTrending: false, rating: 4.1, totalOrders: 900, calories: 420, preparationTime: 12, tags: ['burger', 'veg', 'healthy'] },
  { name: 'Salmon Sushi Roll', description: 'Fresh salmon with avocado', price: 450, category: 'Sushi', isVeg: false, isPopular: true, isTrending: true, rating: 4.8, totalOrders: 1200, calories: 320, preparationTime: 15, tags: ['sushi', 'japanese', 'premium'] },
  { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 180, category: 'Desserts', isVeg: true, isPopular: true, isTrending: true, rating: 4.9, totalOrders: 2800, calories: 480, preparationTime: 15, tags: ['dessert', 'chocolate', 'sweet'] },
  { name: 'Masala Chai', description: 'Spiced Indian tea with milk', price: 60, category: 'Beverages', isVeg: true, isPopular: true, isTrending: false, rating: 4.6, totalOrders: 4500, calories: 120, preparationTime: 5, tags: ['beverage', 'tea', 'indian'] },
  { name: 'Mango Lassi', description: 'Refreshing yogurt-based mango drink', price: 120, category: 'Beverages', isVeg: true, isPopular: true, isTrending: true, rating: 4.7, totalOrders: 3100, calories: 220, preparationTime: 5, tags: ['beverage', 'mango', 'refreshing'] },
  { name: 'Pad Thai', description: 'Stir-fried rice noodles with peanuts', price: 320, category: 'Noodles', isVeg: false, isPopular: false, isTrending: true, rating: 4.4, totalOrders: 800, calories: 560, preparationTime: 20, tags: ['thai', 'noodles', 'asian'] },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Seed Catalog DB
    const catalogConn = await mongoose.createConnection(makeUri('tomato_catalog')).asPromise();
    const Food = catalogConn.model('Food', foodSchema);
    await Food.deleteMany({});
    const foods = await Food.insertMany(FOOD_ITEMS.map((f, i) => ({ ...f, restaurantId: `seed_restaurant_${(i % 4) + 1}`, isAvailable: true })));
    console.log(`✅ Seeded ${foods.length} food items`);
    await catalogConn.close();

    // Seed Restaurant DB
    const restaurantConn = await mongoose.createConnection(makeUri('tomato_restaurants')).asPromise();
    const Restaurant = restaurantConn.model('Restaurant', restaurantSchema);
    await Restaurant.deleteMany({});
    const restaurants = await Restaurant.insertMany(RESTAURANTS);
    console.log(`✅ Seeded ${restaurants.length} restaurants`);
    await restaurantConn.close();

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Customer: customer@tomato.com / Password123!');
    console.log('   Admin:    admin@tomato.com / Admin123!');
    console.log('   Owner:    owner@tomato.com / Owner123!');
    console.log('\n🚀 Start the platform: npm run dev');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
