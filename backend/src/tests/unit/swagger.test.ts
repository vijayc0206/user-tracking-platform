import { swaggerSpec } from '../../config/swagger.js';

describe('Swagger Configuration', () => {
  describe('swaggerSpec', () => {
    it('should export swagger specification', () => {
      expect(swaggerSpec).toBeDefined();
      expect(typeof swaggerSpec).toBe('object');
    });

    it('should have correct OpenAPI version', () => {
      expect(swaggerSpec.openapi).toBe('3.0.0');
    });

    it('should have correct API info', () => {
      expect(swaggerSpec.info).toBeDefined();
      expect(swaggerSpec.info.title).toBe('User Tracking Platform API');
      expect(swaggerSpec.info.version).toBe('1.0.0');
      expect(swaggerSpec.info.description).toBeDefined();
    });

    it('should have server configurations', () => {
      expect(swaggerSpec.servers).toBeDefined();
      expect(Array.isArray(swaggerSpec.servers)).toBe(true);
      expect(swaggerSpec.servers.length).toBeGreaterThan(0);

      const devServer = swaggerSpec.servers.find(
        (s: { description: string }) => s.description === 'Development server'
      );
      expect(devServer).toBeDefined();
    });

    it('should have security schemes', () => {
      expect(swaggerSpec.components).toBeDefined();
      expect(swaggerSpec.components.securitySchemes).toBeDefined();
      expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
      expect(swaggerSpec.components.securitySchemes.bearerAuth.type).toBe('http');
      expect(swaggerSpec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
    });

    it('should have schema definitions', () => {
      expect(swaggerSpec.components.schemas).toBeDefined();
      expect(swaggerSpec.components.schemas.Event).toBeDefined();
      expect(swaggerSpec.components.schemas.User).toBeDefined();
      expect(swaggerSpec.components.schemas.Session).toBeDefined();
      expect(swaggerSpec.components.schemas.ApiResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.Error).toBeDefined();
    });

    it('should have Event schema with correct properties', () => {
      const eventSchema = swaggerSpec.components.schemas.Event;

      expect(eventSchema.type).toBe('object');
      expect(eventSchema.required).toContain('userId');
      expect(eventSchema.required).toContain('sessionId');
      expect(eventSchema.required).toContain('eventType');
      expect(eventSchema.properties.eventType.enum).toBeDefined();
      expect(eventSchema.properties.eventType.enum).toContain('PAGE_VIEW');
      expect(eventSchema.properties.eventType.enum).toContain('PURCHASE');
    });

    it('should have response definitions', () => {
      expect(swaggerSpec.components.responses).toBeDefined();
      expect(swaggerSpec.components.responses.UnauthorizedError).toBeDefined();
      expect(swaggerSpec.components.responses.NotFoundError).toBeDefined();
      expect(swaggerSpec.components.responses.ValidationError).toBeDefined();
    });

    it('should have tags for API grouping', () => {
      expect(swaggerSpec.tags).toBeDefined();
      expect(Array.isArray(swaggerSpec.tags)).toBe(true);

      const tagNames = swaggerSpec.tags.map((t: { name: string }) => t.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Users');
      expect(tagNames).toContain('Events');
      expect(tagNames).toContain('Sessions');
      expect(tagNames).toContain('Analytics');
      expect(tagNames).toContain('Health');
    });

    it('should have Session schema with status enum', () => {
      const sessionSchema = swaggerSpec.components.schemas.Session;

      expect(sessionSchema.properties.status).toBeDefined();
      expect(sessionSchema.properties.status.enum).toContain('ACTIVE');
      expect(sessionSchema.properties.status.enum).toContain('ENDED');
      expect(sessionSchema.properties.status.enum).toContain('EXPIRED');
    });

    it('should have SessionCreate schema', () => {
      const sessionCreateSchema = swaggerSpec.components.schemas.SessionCreate;

      expect(sessionCreateSchema).toBeDefined();
      expect(sessionCreateSchema.required).toContain('userId');
    });
  });
});
