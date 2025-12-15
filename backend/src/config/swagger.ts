import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Tracking Platform API',
      version: '1.0.0',
      description: `
# User Tracking Platform API Documentation

A comprehensive API for tracking user journeys, behaviors, and analytics in an e-commerce environment.

## Features
- **User Tracking**: Track user sessions, page views, and interactions
- **Event Ingestion**: Capture various event types including purchases, clicks, and searches
- **Analytics**: Real-time and historical analytics dashboards
- **User Management**: Manage visitor profiles, tags, and segments

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 10 requests per 15 minutes
- Event Ingestion: 1000 requests per minute
      `,
      contact: {
        name: 'WBD Martech Engineering',
        email: 'support@wbd.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.user-tracking.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Event: {
          type: 'object',
          required: ['userId', 'sessionId', 'eventType'],
          properties: {
            userId: {
              type: 'string',
              description: 'Unique identifier for the user',
            },
            sessionId: {
              type: 'string',
              description: 'Session identifier',
            },
            eventType: {
              type: 'string',
              enum: [
                'SESSION_START',
                'SESSION_END',
                'PAGE_VIEW',
                'PRODUCT_VIEW',
                'ADD_TO_CART',
                'REMOVE_FROM_CART',
                'PURCHASE',
                'SEARCH',
                'CLICK',
                'SCROLL',
              ],
              description: 'Type of event',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Event timestamp',
            },
            properties: {
              type: 'object',
              description: 'Additional event properties',
            },
            metadata: {
              type: 'object',
              properties: {
                userAgent: { type: 'string' },
                ipAddress: { type: 'string' },
                device: { type: 'string' },
                browser: { type: 'string' },
                os: { type: 'string' },
                country: { type: 'string' },
                region: { type: 'string' },
                city: { type: 'string' },
              },
            },
            pageUrl: {
              type: 'string',
              format: 'uri',
            },
            referrer: {
              type: 'string',
              format: 'uri',
            },
            duration: {
              type: 'number',
              description: 'Duration in milliseconds',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            visitorId: {
              type: 'string',
              description: 'Unique visitor identifier',
            },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            attributes: { type: 'object' },
            firstSeen: { type: 'string', format: 'date-time' },
            lastSeen: { type: 'string', format: 'date-time' },
            totalSessions: { type: 'number' },
            totalEvents: { type: 'number' },
            totalPurchases: { type: 'number' },
            totalRevenue: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } },
            segments: { type: 'array', items: { type: 'string' } },
          },
        },
        Session: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            userId: { type: 'string' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'ENDED', 'EXPIRED'],
            },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            duration: { type: 'number' },
            pageViews: { type: 'number' },
            events: { type: 'number' },
            entryPage: { type: 'string' },
            exitPage: { type: 'string' },
            device: { type: 'string' },
            browser: { type: 'string' },
            os: { type: 'string' },
            country: { type: 'string' },
          },
        },
        SessionCreate: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
            device: { type: 'string' },
            browser: { type: 'string' },
            os: { type: 'string' },
            country: { type: 'string' },
            region: { type: 'string' },
            city: { type: 'string' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
            entryPage: { type: 'string', format: 'uri' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Users',
        description: 'User profile management',
      },
      {
        name: 'Events',
        description: 'Event tracking and ingestion',
      },
      {
        name: 'Sessions',
        description: 'Session management',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
