require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const fastifyCors = require('@fastify/cors');
const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://pricelist_db_user:Agz9i9yqW0WFFfgCEofF0EhhOrIsIr7A@dpg-d0jisqidbo4c73dg0300-a/pricelist_db',
  {
    dialect: 'postgres',
    logging: msg => fastify.log.info(msg)
  }
);

// Product model
const Product = sequelize.define('Product', {
  article_no: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  in_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20)
  },
  in_stock: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Register plugins
fastify.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// Get all products
fastify.get('/api/products', async (request, reply) => {
  try {
    const products = await Product.findAll({ order: [['id', 'ASC']] });
    return products;
  } catch (error) {
    fastify.log.error('Error fetching products:', error);
    reply.status(500).send({ error: 'Database error', message: error.message });
  }
});

// Get single product
fastify.get('/api/products/:id', async (request, reply) => {
  try {
    const product = await Product.findByPk(request.params.id);
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    return product;
  } catch (error) {
    fastify.log.error('Error fetching product:', error);
    reply.status(500).send({ error: 'Database error', message: error.message });
  }
});

// Create new product
fastify.post('/api/products', async (request, reply) => {
  try {
    const product = await Product.create(request.body);
    reply.status(201).send(product);
  } catch (error) {
    fastify.log.error('Error creating product:', error);
    reply.status(500).send({ error: 'Creation failed', message: error.message });
  }
});

// Update product
fastify.put('/api/products/:id', async (request, reply) => {
  try {
    const product = await Product.findByPk(request.params.id);
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    await product.update(request.body);
    return product;
  } catch (error) {
    fastify.log.error('Error updating product:', error);
    reply.status(500).send({ error: 'Update failed', message: error.message });
  }
});

// Delete product
fastify.delete('/api/products/:id', async (request, reply) => {
  try {
    const product = await Product.findByPk(request.params.id);
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    await product.destroy();
    return { message: 'Product deleted successfully' };
  } catch (error) {
    fastify.log.error('Error deleting product:', error);
    reply.status(500).send({ error: 'Deletion failed', message: error.message });
  }
});

// Seed database function
async function seedDatabase() {
  const dummyProducts = [
    { article_no: 'ART-1001', product_name: 'Premium Screwdriver Set', in_price: 15.99, price: 29.99, unit: 'set', in_stock: 150, description: '12-piece professional set' },
    { article_no: 'ART-1002', product_name: 'Wireless Mouse', in_price: 8.50, price: 19.99, unit: 'pcs', in_stock: 200, description: 'Ergonomic wireless mouse' },
    { article_no: 'ART-1003', product_name: 'Bluetooth Keyboard', in_price: 18.00, price: 34.99, unit: 'pcs', in_stock: 120, description: 'Slim design with rechargeable battery' },
    { article_no: 'ART-1004', product_name: 'USB-C Hub', in_price: 10.50, price: 24.99, unit: 'pcs', in_stock: 90, description: '4-in-1 USB-C hub for laptops' },
    { article_no: 'ART-1005', product_name: 'Laptop Stand', in_price: 9.90, price: 22.99, unit: 'pcs', in_stock: 75, description: 'Adjustable aluminum stand' },
    { article_no: 'ART-1006', product_name: 'HDMI Cable 2m', in_price: 3.50, price: 9.99, unit: 'pcs', in_stock: 300, description: 'High-speed 4K HDMI cable' },
    { article_no: 'ART-1007', product_name: 'Wireless Charger Pad', in_price: 7.20, price: 18.99, unit: 'pcs', in_stock: 110, description: 'Qi-enabled fast charger' },
    { article_no: 'ART-1008', product_name: 'Noise Cancelling Headphones', in_price: 45.00, price: 89.99, unit: 'pcs', in_stock: 50, description: 'Over-ear design with ANC' },
    { article_no: 'ART-1009', product_name: 'Gaming Mouse Pad', in_price: 2.99, price: 8.99, unit: 'pcs', in_stock: 250, description: 'Extended size for gaming setups' },
    { article_no: 'ART-1010', product_name: 'Portable SSD 512GB', in_price: 39.99, price: 79.99, unit: 'pcs', in_stock: 60, description: 'USB 3.1 high-speed storage' },
    { article_no: 'ART-1011', product_name: 'Webcam HD 1080p', in_price: 12.50, price: 29.99, unit: 'pcs', in_stock: 130, description: 'Full HD webcam with mic' },
    { article_no: 'ART-1012', product_name: 'Smart LED Bulb', in_price: 5.25, price: 12.99, unit: 'pcs', in_stock: 180, description: 'Wi-Fi enabled color bulb' },
    { article_no: 'ART-1013', product_name: 'Mini Projector', in_price: 55.00, price: 119.99, unit: 'pcs', in_stock: 25, description: 'Portable projector with HDMI' },
    { article_no: 'ART-1014', product_name: 'Fitness Tracker', in_price: 19.99, price: 39.99, unit: 'pcs', in_stock: 95, description: 'Tracks steps, sleep, and heart rate' },
    { article_no: 'ART-1015', product_name: 'Smart Watch', in_price: 35.00, price: 74.99, unit: 'pcs', in_stock: 80, description: 'Water-resistant with notifications' },
    { article_no: 'ART-1016', product_name: 'Electric Kettle', in_price: 12.00, price: 27.99, unit: 'pcs', in_stock: 140, description: '1.5L fast boiling' },
    { article_no: 'ART-1017', product_name: 'Desk Lamp LED', in_price: 6.50, price: 14.99, unit: 'pcs', in_stock: 100, description: 'Adjustable brightness with USB port' },
    { article_no: 'ART-1018', product_name: 'Action Camera 4K', in_price: 42.00, price: 89.99, unit: 'pcs', in_stock: 35, description: 'Waterproof with accessories' },
    { article_no: 'ART-1019', product_name: 'Wireless Earbuds', in_price: 16.50, price: 39.99, unit: 'pcs', in_stock: 160, description: 'True wireless stereo earbuds' },
    { article_no: 'ART-1020', product_name: 'Laptop Backpack', in_price: 18.75, price: 44.99, unit: 'pcs', in_stock: 70, description: 'Water-resistant with USB charging port' }
  ];

  try {
    await Product.bulkCreate(dummyProducts);
    fastify.log.info(`Seeded ${dummyProducts.length} products`);
  } catch (error) {
    fastify.log.error('Error seeding database:', error);
  }
}

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    fastify.log.info('Database connection established');

    // Sync database - force: true only in development
    await sequelize.sync({ force: process.env.NODE_ENV !== 'production' });
    fastify.log.info('Database synchronized');

    // Seed only if not in production and DB is empty
    if ((await Product.count()) === 0) {
      await seedDatabase();
    }

    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Shutting down server...');
  await fastify.close();
  await sequelize.close();
  process.exit(0);
});

start();
