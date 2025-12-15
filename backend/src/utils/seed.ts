import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { config } from '../config/index.js';
import { User, Event, Session, AdminUser, Product } from '../models/index.js';
import { EventType, SessionStatus, UserRole, DeviceType, ProductCategory } from '../types/index.js';
import { logger } from './logger.js';

const USERS_COUNT = 1000;
const EVENTS_PER_USER = 50;
const PRODUCTS_COUNT = 100;
const ADMIN_USERS = 5;

const eventTypes = Object.values(EventType);
const deviceTypes = Object.values(DeviceType);
const productCategories = Object.values(ProductCategory);

// Indian Names Data
const indianFirstNamesMale = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advait', 'Pranav', 'Aryan', 'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Kayaan',
  'Darsh', 'Veer', 'Rudra', 'Arnav', 'Yash', 'Neil', 'Rohan', 'Rishi', 'Siddharth', 'Ansh',
  'Rahul', 'Amit', 'Vikram', 'Suresh', 'Rajesh', 'Deepak', 'Manish', 'Nikhil', 'Akash', 'Gaurav',
  'Karan', 'Varun', 'Harsh', 'Piyush', 'Aakash', 'Aman', 'Mayank', 'Sachin', 'Mohit', 'Vishal'
];

const indianFirstNamesFemale = [
  'Aanya', 'Aadhya', 'Myra', 'Ananya', 'Pari', 'Anika', 'Navya', 'Diya', 'Saanvi', 'Kiara',
  'Aarohi', 'Avni', 'Riya', 'Isha', 'Kavya', 'Sara', 'Aisha', 'Siya', 'Meera', 'Priya',
  'Nisha', 'Shreya', 'Pooja', 'Neha', 'Anjali', 'Divya', 'Swati', 'Sneha', 'Kavitha', 'Pallavi',
  'Preeti', 'Sunita', 'Rekha', 'Shalini', 'Deepika', 'Rashmi', 'Komal', 'Mansi', 'Tanvi', 'Aditi'
];

const indianLastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Mukherjee',
  'Joshi', 'Rao', 'Pillai', 'Menon', 'Agarwal', 'Srivastava', 'Mishra', 'Pandey', 'Tiwari', 'Mehta',
  'Shah', 'Jain', 'Kapoor', 'Malhotra', 'Bhatia', 'Khanna', 'Chopra', 'Bansal', 'Goel', 'Saxena',
  'Chauhan', 'Yadav', 'Dubey', 'Trivedi', 'Desai', 'Kulkarni', 'Deshpande', 'Patil', 'Naidu', 'Rajan'
];

// Indian Cities and States
const indianCities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Gurgaon', state: 'Haryana' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Ranchi', state: 'Jharkhand' }
];

// Indian Products with INR pricing
const indianProducts = {
  electronics: [
    { name: 'Samsung Galaxy S24 Ultra', price: 129999 },
    { name: 'iPhone 15 Pro Max', price: 159900 },
    { name: 'OnePlus 12', price: 64999 },
    { name: 'Realme GT 5 Pro', price: 35999 },
    { name: 'Sony WH-1000XM5 Headphones', price: 29990 },
    { name: 'JBL Flip 6 Speaker', price: 12999 },
    { name: 'Apple MacBook Air M3', price: 114900 },
    { name: 'HP Pavilion Laptop', price: 65990 },
    { name: 'Dell Inspiron 15', price: 54990 },
    { name: 'Samsung 55" Smart TV', price: 49990 },
    { name: 'LG 43" 4K TV', price: 32990 },
    { name: 'boAt Airdopes 141', price: 1299 },
    { name: 'Fire TV Stick 4K', price: 5999 },
    { name: 'Mi Power Bank 20000mAh', price: 1499 },
  ],
  clothing: [
    { name: 'Raymond Formal Shirt', price: 1999 },
    { name: 'Allen Solly Blazer', price: 5999 },
    { name: 'Van Heusen Trousers', price: 2499 },
    { name: 'Levi\'s 511 Jeans', price: 3299 },
    { name: 'U.S. Polo T-Shirt', price: 999 },
    { name: 'Peter England Formal Shirt', price: 1499 },
    { name: 'Biba Kurta Set', price: 2999 },
    { name: 'W Ethnic Dress', price: 1899 },
    { name: 'Fabindia Cotton Saree', price: 4999 },
    { name: 'Manyavar Sherwani', price: 12999 },
    { name: 'Global Desi Kurti', price: 1299 },
    { name: 'Jack & Jones Casual Shirt', price: 1799 },
  ],
  footwear: [
    { name: 'Nike Air Max', price: 12995 },
    { name: 'Adidas Ultraboost', price: 16999 },
    { name: 'Puma RS-X', price: 8999 },
    { name: 'Woodland Boots', price: 4995 },
    { name: 'Red Tape Formal Shoes', price: 2999 },
    { name: 'Bata Power Sports Shoes', price: 1999 },
    { name: 'Sparx Running Shoes', price: 999 },
    { name: 'Metro Heels', price: 2499 },
    { name: 'Crocs Classic Clogs', price: 2995 },
    { name: 'Relaxo Flip Flops', price: 299 },
  ],
  home: [
    { name: 'Prestige Pressure Cooker 5L', price: 2499 },
    { name: 'Philips Air Fryer', price: 8999 },
    { name: 'Bajaj Mixer Grinder', price: 3499 },
    { name: 'IFB Washing Machine 6.5kg', price: 24990 },
    { name: 'Godrej Refrigerator 260L', price: 28990 },
    { name: 'Havells Ceiling Fan', price: 2199 },
    { name: 'Crompton Water Heater 15L', price: 6999 },
    { name: 'Nilkamal Dining Table Set', price: 15999 },
    { name: 'Wakefit Mattress Queen', price: 11999 },
    { name: 'Urban Ladder Sofa', price: 35999 },
  ],
  beauty: [
    { name: 'Lakme Absolute Foundation', price: 899 },
    { name: 'Maybelline Mascara', price: 499 },
    { name: 'Forest Essentials Face Cream', price: 1995 },
    { name: 'Biotique Bio Shampoo', price: 299 },
    { name: 'Himalaya Face Wash', price: 199 },
    { name: 'Nivea Body Lotion', price: 349 },
    { name: 'Lotus Herbal Sunscreen', price: 425 },
    { name: 'Mamaearth Hair Oil', price: 399 },
    { name: 'Plum Green Tea Serum', price: 575 },
    { name: 'WOW Skin Science Kit', price: 999 },
  ],
  sports: [
    { name: 'SG Cricket Bat', price: 4999 },
    { name: 'Cosco Football', price: 799 },
    { name: 'Yonex Badminton Racket', price: 2999 },
    { name: 'Nivia Basketball', price: 999 },
    { name: 'Vector X Football Shoes', price: 1499 },
    { name: 'Fitbit Charge 5', price: 14999 },
    { name: 'Decathlon Yoga Mat', price: 499 },
    { name: 'Powermax Treadmill', price: 29999 },
    { name: 'Strauss Dumbbells Set', price: 1999 },
    { name: 'Boldfit Resistance Bands', price: 399 },
  ],
  books: [
    { name: 'The Alchemist', price: 299 },
    { name: 'Atomic Habits', price: 499 },
    { name: 'Rich Dad Poor Dad', price: 399 },
    { name: 'The Psychology of Money', price: 349 },
    { name: 'Ikigai', price: 299 },
    { name: 'Wings of Fire - APJ Abdul Kalam', price: 250 },
    { name: 'You Can Win - Shiv Khera', price: 199 },
    { name: 'The Monk Who Sold His Ferrari', price: 299 },
    { name: 'Half Girlfriend - Chetan Bhagat', price: 175 },
    { name: '2 States - Chetan Bhagat', price: 175 },
  ],
  food: [
    { name: 'Tata Tea Gold 1kg', price: 499 },
    { name: 'Nescafe Classic 200g', price: 525 },
    { name: 'Aashirvaad Atta 10kg', price: 449 },
    { name: 'Fortune Rice Bran Oil 5L', price: 799 },
    { name: 'Amul Butter 500g', price: 275 },
    { name: 'Cadbury Dairy Milk Silk', price: 85 },
    { name: 'Haldiram Namkeen Pack', price: 199 },
    { name: 'MTR Ready to Eat Biryani', price: 149 },
    { name: 'Maggi Noodles Family Pack', price: 240 },
    { name: 'Britannia Good Day Cookies', price: 99 },
  ],
};

// Indian Brands
const indianBrands = [
  'Tata', 'Reliance', 'Bajaj', 'Mahindra', 'Godrej', 'Titan', 'Dabur', 'Patanjali', 'Amul', 'Haldiram',
  'Fabindia', 'Biba', 'W', 'Manyavar', 'Raymond', 'Allen Solly', 'Van Heusen', 'Peter England',
  'boAt', 'Noise', 'Mamaearth', 'WOW', 'Himalaya', 'Lakme', 'Biotique', 'Forest Essentials'
];

// Indian Payment Methods
const indianPaymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Paytm', 'PhonePe', 'Google Pay', 'COD'];

function getRandomIndianName() {
  const isMale = faker.datatype.boolean();
  const firstName = isMale
    ? faker.helpers.arrayElement(indianFirstNamesMale)
    : faker.helpers.arrayElement(indianFirstNamesFemale);
  const lastName = faker.helpers.arrayElement(indianLastNames);
  return { firstName, lastName, gender: isMale ? 'male' : 'female' };
}

function getRandomIndianLocation() {
  return faker.helpers.arrayElement(indianCities);
}

function getIndianPhoneNumber() {
  const prefixes = ['98', '99', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70'];
  return `+91 ${faker.helpers.arrayElement(prefixes)}${faker.string.numeric(8)}`;
}

function getIndianEmail(firstName: string, lastName: string) {
  const domains = ['gmail.com', 'yahoo.co.in', 'rediffmail.com', 'outlook.com', 'hotmail.com'];
  const formats = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${faker.number.int({ min: 1, max: 99 })}`,
  ];
  return `${faker.helpers.arrayElement(formats)}@${faker.helpers.arrayElement(domains)}`;
}

async function seedProducts(): Promise<string[]> {
  logger.info('Seeding Indian products...');
  const products = [];
  let productIndex = 0;

  for (const [category, items] of Object.entries(indianProducts)) {
    for (const item of items) {
      products.push({
        productId: `PROD-${String(++productIndex).padStart(4, '0')}`,
        name: item.name,
        category: category as ProductCategory,
        price: item.price,
        currency: 'INR',
        description: faker.commerce.productDescription(),
        imageUrl: faker.image.url(),
        attributes: {
          brand: faker.helpers.arrayElement(indianBrands),
          color: faker.helpers.arrayElement(['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Grey', 'Brown', 'Multi']),
          size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']),
        },
        inventory: faker.number.int({ min: 0, max: 1000 }),
        isActive: faker.datatype.boolean({ probability: 0.9 }),
      });
    }
  }

  // Add more random products to reach PRODUCTS_COUNT
  while (products.length < PRODUCTS_COUNT) {
    const category = faker.helpers.arrayElement(Object.keys(indianProducts)) as keyof typeof indianProducts;
    const baseProduct = faker.helpers.arrayElement(indianProducts[category]);
    products.push({
      productId: `PROD-${String(++productIndex).padStart(4, '0')}`,
      name: `${faker.helpers.arrayElement(indianBrands)} ${baseProduct.name}`,
      category: category as ProductCategory,
      price: Math.round(baseProduct.price * faker.number.float({ min: 0.8, max: 1.2 })),
      currency: 'INR',
      description: faker.commerce.productDescription(),
      imageUrl: faker.image.url(),
      attributes: {
        brand: faker.helpers.arrayElement(indianBrands),
        color: faker.helpers.arrayElement(['Black', 'White', 'Blue', 'Red', 'Green']),
        size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
      },
      inventory: faker.number.int({ min: 0, max: 1000 }),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
    });
  }

  await Product.insertMany(products);
  const savedProducts = await Product.find({}, { productId: 1 });
  logger.info(`Created ${products.length} Indian products`);
  return savedProducts.map((p) => p.productId);
}

async function seedUsers(): Promise<string[]> {
  logger.info('Seeding Indian users...');
  const users = [];

  for (let i = 0; i < USERS_COUNT; i++) {
    const { firstName, lastName, gender } = getRandomIndianName();
    const location = getRandomIndianLocation();
    const firstSeen = faker.date.past({ years: 1 });
    const lastSeen = faker.date.recent({ days: 30 });

    users.push({
      visitorId: `VIS-${faker.string.alphanumeric(12)}`,
      email: getIndianEmail(firstName, lastName),
      firstName,
      lastName,
      attributes: {
        phone: getIndianPhoneNumber(),
        age: faker.number.int({ min: 18, max: 65 }),
        gender,
        country: 'India',
        state: location.state,
        city: location.city,
        pincode: faker.string.numeric(6),
      },
      firstSeen,
      lastSeen,
      totalSessions: faker.number.int({ min: 1, max: 100 }),
      totalEvents: faker.number.int({ min: 10, max: 500 }),
      totalPurchases: faker.number.int({ min: 0, max: 20 }),
      totalRevenue: faker.number.int({ min: 0, max: 500000 }), // INR
      tags: faker.helpers.arrayElements(
        ['vip', 'new', 'returning', 'churned', 'active', 'premium'],
        faker.number.int({ min: 0, max: 3 })
      ),
      segments: faker.helpers.arrayElements(
        ['high_value', 'new_user', 'returning', 'at_risk', 'engaged', 'metro_city', 'tier2_city'],
        faker.number.int({ min: 1, max: 3 })
      ),
    });
  }

  await User.insertMany(users);
  const savedUsers = await User.find({}, { visitorId: 1 });
  logger.info(`Created ${USERS_COUNT} Indian users`);
  return savedUsers.map((u) => u.visitorId);
}

async function seedSessions(visitorIds: string[]): Promise<Map<string, string[]>> {
  logger.info('Seeding sessions...');
  const sessions = [];
  const userSessionMap = new Map<string, string[]>();

  for (const visitorId of visitorIds) {
    const sessionCount = faker.number.int({ min: 1, max: 5 });
    const sessionIds: string[] = [];

    for (let i = 0; i < sessionCount; i++) {
      const startTime = faker.date.recent({ days: 30 });
      const sessionId = `SES-${faker.string.alphanumeric(16)}`;
      sessionIds.push(sessionId);

      const location = getRandomIndianLocation();
      const pageViews = faker.number.int({ min: 1, max: 20 });
      const durationSeconds = faker.number.int({ min: 60, max: 3600 }); // 1-60 minutes in seconds
      const durationMs = durationSeconds * 1000; // Convert to milliseconds for storage
      const eventsCount = faker.number.int({ min: 1, max: 50 });

      sessions.push({
        sessionId,
        userId: visitorId,
        startTime,
        endTime: new Date(startTime.getTime() + durationMs),
        duration: durationMs,
        status: faker.helpers.arrayElement(Object.values(SessionStatus)),
        device: faker.helpers.arrayElement(deviceTypes),
        browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge', 'Samsung Internet']),
        os: faker.helpers.arrayElement(['Windows', 'Android', 'iOS', 'macOS']),
        country: 'IN',
        region: location.state,
        city: location.city,
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        pageViews,
        events: eventsCount,
        entryPage: `/${faker.helpers.arrayElement(['home', 'products', 'category', 'offers', 'sale'])}`,
        exitPage: `/${faker.helpers.arrayElement(['checkout', 'cart', 'products', 'home', 'payment'])}`,
      });
    }

    userSessionMap.set(visitorId, sessionIds);
  }

  await Session.insertMany(sessions);
  logger.info(`Created ${sessions.length} sessions`);
  return userSessionMap;
}

async function seedEvents(
  visitorIds: string[],
  userSessionMap: Map<string, string[]>,
  productIds: string[]
): Promise<void> {
  logger.info('Seeding events...');
  const batchSize = 5000;
  let events: any[] = [];
  let totalEvents = 0;

  const savedProducts = await Product.find({});
  const productMap = new Map(savedProducts.map(p => [p.productId, p]));

  for (const visitorId of visitorIds) {
    const sessionIds = userSessionMap.get(visitorId) || [];
    const eventsCount = faker.number.int({
      min: Math.floor(EVENTS_PER_USER / 2),
      max: EVENTS_PER_USER,
    });

    for (let i = 0; i < eventsCount; i++) {
      const eventType = faker.helpers.arrayElement(eventTypes);
      const sessionId = faker.helpers.arrayElement(sessionIds);
      const timestamp = faker.date.recent({ days: 30 });
      const location = getRandomIndianLocation();

      const event: any = {
        eventId: `EVT-${faker.string.alphanumeric(16)}`,
        userId: visitorId,
        sessionId,
        eventType,
        timestamp,
        pageUrl: `https://shop.example.in/${faker.helpers.arrayElement(['products', 'category', 'deals', 'offers'])}/${faker.string.alphanumeric(8)}`,
        referrer: faker.helpers.maybe(() => faker.helpers.arrayElement(['https://google.co.in', 'https://facebook.com', 'https://instagram.com', 'https://youtube.com'])),
        properties: {},
        metadata: {
          userAgent: faker.internet.userAgent(),
          ipAddress: faker.internet.ip(),
          device: faker.helpers.arrayElement(deviceTypes),
          browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge', 'Samsung Internet']),
          os: faker.helpers.arrayElement(['Windows', 'Android', 'iOS', 'macOS']),
          country: 'IN',
          region: location.state,
          city: location.city,
        },
      };

      // Add event-specific properties
      switch (eventType) {
        case EventType.PAGE_VIEW:
          event.properties = {
            pageTitle: faker.helpers.arrayElement(['Home', 'Products', 'Offers', 'Cart', 'Checkout', 'My Account']),
            loadTime: faker.number.int({ min: 100, max: 3000 }),
            scrollDepth: faker.number.int({ min: 0, max: 100 }),
          };
          break;
        case EventType.PRODUCT_VIEW:
        case EventType.ADD_TO_CART:
        case EventType.REMOVE_FROM_CART: {
          const productId = faker.helpers.arrayElement(productIds);
          const product = productMap.get(productId);
          event.properties = {
            productId,
            name: product?.name || 'Unknown Product',
            category: product?.category || faker.helpers.arrayElement(productCategories),
            price: product?.price || faker.number.int({ min: 100, max: 10000 }),
            currency: 'INR',
            quantity: faker.number.int({ min: 1, max: 5 }),
          };
          break;
        }
        case EventType.PURCHASE: {
          const itemCount = faker.number.int({ min: 1, max: 5 });
          const items = [];
          let total = 0;
          for (let j = 0; j < itemCount; j++) {
            const pId = faker.helpers.arrayElement(productIds);
            const prod = productMap.get(pId);
            const price = prod?.price || faker.number.int({ min: 500, max: 15000 });
            const quantity = faker.number.int({ min: 1, max: 3 });
            total += price * quantity;
            items.push({
              productId: pId,
              name: prod?.name || 'Product',
              category: prod?.category || faker.helpers.arrayElement(productCategories),
              price,
              quantity,
            });
          }
          const finalTotal = Math.round(total * 1.18 * (1 - faker.number.float({ min: 0, max: 0.2 })));
          event.properties = {
            orderId: `ORD-${faker.string.alphanumeric(10).toUpperCase()}`,
            items,
            subtotal: total,
            discount: Math.round(total * faker.number.float({ min: 0, max: 0.2 })),
            tax: Math.round(total * 0.18), // 18% GST
            total: finalTotal,
            amount: finalTotal, // Used by analytics service
            currency: 'INR',
            paymentMethod: faker.helpers.arrayElement(indianPaymentMethods),
            shippingAddress: {
              city: location.city,
              state: location.state,
              pincode: faker.string.numeric(6),
            },
          };
          break;
        }
        case EventType.SEARCH:
          event.properties = {
            query: faker.helpers.arrayElement([
              'mobile phone', 'laptop', 'saree', 'kurta', 'shoes', 'watch', 'headphones',
              'camera', 'tv', 'refrigerator', 'ac', 'mixer', 'pressure cooker', 'cricket bat'
            ]),
            resultsCount: faker.number.int({ min: 0, max: 500 }),
            filters: {
              priceRange: faker.helpers.arrayElement(['Under ₹500', '₹500-₹1000', '₹1000-₹5000', 'Above ₹5000']),
              brand: faker.helpers.arrayElement(indianBrands),
            },
          };
          break;
        case EventType.FORM_SUBMIT:
          event.properties = {
            formId: faker.string.uuid(),
            formName: faker.helpers.arrayElement(['newsletter', 'contact', 'feedback', 'review', 'enquiry']),
            success: faker.datatype.boolean({ probability: 0.9 }),
          };
          break;
        case EventType.CLICK:
          event.properties = {
            elementId: faker.string.uuid(),
            elementText: faker.helpers.arrayElement(['Buy Now', 'Add to Cart', 'View Details', 'Apply Coupon', 'Check Pincode']),
            elementType: faker.helpers.arrayElement(['button', 'link', 'image', 'banner']),
          };
          break;
      }

      events.push(event);

      if (events.length >= batchSize) {
        await Event.insertMany(events);
        totalEvents += events.length;
        logger.info(`Inserted ${totalEvents} events...`);
        events = [];
      }
    }
  }

  if (events.length > 0) {
    await Event.insertMany(events);
    totalEvents += events.length;
  }

  logger.info(`Created ${totalEvents} events`);
}

async function seedAdminUsers(): Promise<void> {
  logger.info('Seeding admin users...');

  const adminUsers = [
    {
      email: 'admin@example.com',
      password: 'Admin123!@#',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      email: 'manager@example.com',
      password: 'Manager123!@#',
      firstName: 'Priya',
      lastName: 'Patel',
      role: UserRole.MANAGER,
      isActive: true,
    },
    {
      email: 'analyst@example.com',
      password: 'Analyst123!@#',
      firstName: 'Amit',
      lastName: 'Kumar',
      role: UserRole.ANALYST,
      isActive: true,
    },
    {
      email: 'viewer@example.com',
      password: 'Viewer123!@#',
      firstName: 'Sneha',
      lastName: 'Gupta',
      role: UserRole.VIEWER,
      isActive: true,
    },
  ];

  // Add random admin users with Indian names
  for (let i = 0; i < ADMIN_USERS - adminUsers.length; i++) {
    const { firstName, lastName } = getRandomIndianName();
    adminUsers.push({
      email: getIndianEmail(firstName, lastName),
      password: 'Password123!@#',
      firstName,
      lastName,
      role: faker.helpers.arrayElement([UserRole.ANALYST, UserRole.VIEWER]),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
    });
  }

  for (const userData of adminUsers) {
    const user = new AdminUser(userData);
    await user.save();
  }

  logger.info(`Created ${adminUsers.length} admin users`);
  logger.info('Default admin credentials: admin@example.com / Admin123!@#');
}

async function seed(): Promise<void> {
  try {
    logger.info('Starting database seeding with Indian data...');
    logger.info(`Connecting to MongoDB: ${config.mongodb.uri.substring(0, 30)}...`);

    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    logger.info('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Session.deleteMany({}),
      AdminUser.deleteMany({}),
      Product.deleteMany({}),
    ]);

    // Seed data
    const productIds = await seedProducts();
    const visitorIds = await seedUsers();
    const userSessionMap = await seedSessions(visitorIds);
    await seedEvents(visitorIds, userSessionMap, productIds);
    await seedAdminUsers();

    logger.info('Database seeding completed successfully!');
    logger.info(`
Summary:
- Products: ${PRODUCTS_COUNT} (Indian products with INR pricing)
- Users: ${USERS_COUNT} (Indian users)
- Sessions: ~${USERS_COUNT * 3}
- Events: ~${USERS_COUNT * EVENTS_PER_USER}
- Admin Users: ${ADMIN_USERS}
- Currency: INR (Indian Rupees)
- Location: India (25 major cities)
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
