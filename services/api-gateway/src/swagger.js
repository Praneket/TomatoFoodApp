const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'Tomato Food Delivery Platform API',
    version: '1.0.0',
    description: 'Complete API documentation for the Tomato microservices platform',
    contact: { name: 'Tomato Team', email: 'api@tomato.com' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://api.tomato.com', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'] },
          avatar: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Restaurant: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          cuisine: { type: 'array', items: { type: 'string' } },
          rating: { type: 'number' },
          deliveryTime: { type: 'number' },
          minOrder: { type: 'number' },
          isOpen: { type: 'boolean' },
        },
      },
      FoodItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          image: { type: 'string' },
          isVeg: { type: 'boolean' },
          rating: { type: 'number' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          restaurantId: { type: 'string' },
          items: { type: 'array' },
          totalAmount: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'] },
          paymentMethod: { type: 'string', enum: ['stripe', 'razorpay', 'cod'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', minLength: 8 },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['customer', 'restaurant_owner', 'delivery_partner'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT tokens' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/catalog/foods': {
      get: {
        tags: ['Catalog'],
        summary: 'Get all food items with filters',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'rating', 'popular'] } },
        ],
        responses: { 200: { description: 'List of food items' } },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place a new order',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['restaurantId', 'items', 'deliveryAddress', 'paymentMethod'],
                properties: {
                  restaurantId: { type: 'string' },
                  items: { type: 'array', items: { type: 'object', properties: { foodId: { type: 'string' }, quantity: { type: 'integer' } } } },
                  deliveryAddress: { type: 'object' },
                  paymentMethod: { type: 'string', enum: ['stripe', 'razorpay', 'cod'] },
                  couponCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order placed successfully' },
          400: { description: 'Validation error' },
        },
      },
    },
  },
};

module.exports = swaggerDoc;
