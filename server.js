require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const fastifyCors = require('@fastify/cors');
const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:pass@localhost:5432/pricelist_app',
  {
    dialect: 'postgres',
    logging: msg => fastify.log.info(msg)
  }
);

// Product model
const Product = sequelize.define('Product', {
  article_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'article_no'
  },
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'product_name'
  },
  in_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'in_price'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price'
  },
  unit: {
    type: DataTypes.STRING(20),
    field: 'unit'
  },
  in_stock: {
    type: DataTypes.INTEGER,
    field: 'in_stock'
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
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
    const products = await Product.findAll({
      order: [['id', 'ASC']]
    });
    return products;
  } catch (error) {
    fastify.log.error('Error fetching products:', error);
    reply.status(500).send({
      error: 'Database error',
      message: error.message
    });
  }
});

// Get single product
fastify.get('/api/products/:id', async (request, reply) => {
  try {
    const product = await Product.findByPk(request.params.id);
    if (!product) {
      reply.status(404).send({ error: 'Product not found' });
      return;
    }
    return product;
  } catch (error) {
    fastify.log.error('Error fetching product:', error);
    reply.status(500).send({
      error: 'Database error',
      message: error.message
    });
  }
});

// Create new product
fastify.post('/api/products', async (request, reply) => {
  try {
    const product = await Product.create(request.body);
    reply.status(201).send(product);
  } catch (error) {
    fastify.log.error('Error creating product:', error);
    reply.status(500).send({
      error: 'Creation failed',
      message: error.message
    });
  }
});

// Update product
fastify.put('/api/products/:id', async (request, reply) => {
  try {
    const product = await Product.findByPk(request.params.id);
    if (!product) {
      reply.status(404).send({ error: 'Product not found' });
      return;
    }
    await product.update(request.body);
    return product;
  } catch (error) {
    fastify.log.error('Error updating product:', error);
    reply.status(500).send({
      error: 'Update failed',
      message: error.message
    });
  }
});

// Delete product
fastify.delete('/api/products/:id', async (request, reply) => {
  try {
    const product = await Product.findByPk(request.params.id);
    if (!product) {
      reply.status(404).send({ error: 'Product not found' });
      return;
    }
    await product.destroy();
    return { message: 'Product deleted successfully' };
  } catch (error) {
    fastify.log.error('Error deleting product:', error);
    reply.status(500).send({
      error: 'Deletion failed',
      message: error.message
    });
  }
});

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    fastify.log.info('Database connection established');
    
    // Sync database - force: true only in development!
    await sequelize.sync({ force: process.env.NODE_ENV !== 'production' });
    fastify.log.info('Database synchronized');
    
    // Seed database if needed
    if (process.env.NODE_ENV !== 'production' && (await Product.count()) === 0) {
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

// Seed database function
async function seedDatabase() {
  const dummyProducts = [
    { article_no: 'ART-1001', product_name: 'Premium Screwdriver Set', in_price: 15.99, price: 29.99, unit: 'set', in_stock: 150, description: '12-piece professional set' },
    { article_no: 'ART-1002', product_name: 'Wireless Mouse', in_price: 8.50, price: 19.99, unit: 'pcs', in_stock: 200, description: 'Ergonomic wireless mouse' },
    // Add more products as needed...
  ];
  
  try {
    await Product.bulkCreate(dummyProducts);
    fastify.log.info(`Seeded ${dummyProducts.length} products`);
  } catch (error) {
    fastify.log.error('Error seeding database:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Shutting down server...');
  await fastify.close();
  await sequelize.close();
  process.exit(0);
});

start();