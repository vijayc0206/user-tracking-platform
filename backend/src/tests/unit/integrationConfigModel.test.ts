import mongoose from 'mongoose';
import { IntegrationConfig } from '../../models/IntegrationConfig.js';

describe('IntegrationConfig Model', () => {
  beforeEach(async () => {
    await IntegrationConfig.deleteMany({});
  });

  describe('create', () => {
    it('should create an integration config with required fields', async () => {
      const configData = {
        name: 'Test Integration',
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
      };

      const config = await IntegrationConfig.create(configData);

      expect(config.name).toBe('Test Integration');
      expect(config.type).toBe('IMPORT');
      expect(config.endpoint).toBe('https://api.example.com/data');
      expect(config.method).toBe('GET');
      expect(config.authType).toBe('NONE');
      expect(config.isActive).toBe(true);
    });

    it('should create an export config', async () => {
      const configData = {
        name: 'Export Integration',
        type: 'EXPORT',
        endpoint: 'https://api.example.com/export',
        method: 'POST',
      };

      const config = await IntegrationConfig.create(configData);

      expect(config.type).toBe('EXPORT');
      expect(config.method).toBe('POST');
    });

    it('should create config with all auth types', async () => {
      const authTypes = ['API_KEY', 'OAUTH', 'BASIC', 'NONE'];

      for (let i = 0; i < authTypes.length; i++) {
        const config = await IntegrationConfig.create({
          name: `Auth Test ${i}`,
          type: 'IMPORT',
          endpoint: 'https://api.example.com/data',
          authType: authTypes[i],
        });

        expect(config.authType).toBe(authTypes[i]);
      }
    });

    it('should create config with headers and authConfig', async () => {
      const configData = {
        name: 'Full Config',
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
        authType: 'API_KEY',
        authConfig: { apiKey: 'secret-key', headerName: 'X-API-Key' },
      };

      const config = await IntegrationConfig.create(configData);

      expect(config.headers).toEqual({ 'Content-Type': 'application/json', 'X-Custom': 'value' });
      expect(config.authConfig).toEqual({ apiKey: 'secret-key', headerName: 'X-API-Key' });
    });

    it('should create config with mapping and schedule', async () => {
      const configData = {
        name: 'Scheduled Config',
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
        mapping: { sourceField: 'targetField', nested: { a: 'b' } },
        schedule: '0 0 * * *', // Daily at midnight
      };

      const config = await IntegrationConfig.create(configData);

      expect(config.mapping).toEqual({ sourceField: 'targetField', nested: { a: 'b' } });
      expect(config.schedule).toBe('0 0 * * *');
    });

    it('should fail with invalid type', async () => {
      const configData = {
        name: 'Invalid Type',
        type: 'INVALID',
        endpoint: 'https://api.example.com/data',
      };

      await expect(IntegrationConfig.create(configData)).rejects.toThrow();
    });

    it('should fail with invalid method', async () => {
      const configData = {
        name: 'Invalid Method',
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
        method: 'DELETE',
      };

      await expect(IntegrationConfig.create(configData)).rejects.toThrow();
    });

    it('should fail with invalid authType', async () => {
      const configData = {
        name: 'Invalid Auth',
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
        authType: 'INVALID',
      };

      await expect(IntegrationConfig.create(configData)).rejects.toThrow();
    });

    it('should fail without required name', async () => {
      const configData = {
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
      };

      await expect(IntegrationConfig.create(configData)).rejects.toThrow();
    });

    it('should fail without required endpoint', async () => {
      const configData = {
        name: 'No Endpoint',
        type: 'IMPORT',
      };

      await expect(IntegrationConfig.create(configData)).rejects.toThrow();
    });

    it('should enforce unique name', async () => {
      const configData = {
        name: 'Unique Test',
        type: 'IMPORT',
        endpoint: 'https://api.example.com/data',
      };

      await IntegrationConfig.create(configData);
      // Ensure indexes are synced before testing unique constraint
      await IntegrationConfig.syncIndexes();
      await expect(IntegrationConfig.create(configData)).rejects.toThrow();
    });
  });

  describe('static methods', () => {
    describe('findActiveImports', () => {
      it('should return only active import configs', async () => {
        await IntegrationConfig.create({
          name: 'Active Import',
          type: 'IMPORT',
          endpoint: 'https://api.example.com/import',
          isActive: true,
        });
        await IntegrationConfig.create({
          name: 'Inactive Import',
          type: 'IMPORT',
          endpoint: 'https://api.example.com/import2',
          isActive: false,
        });
        await IntegrationConfig.create({
          name: 'Active Export',
          type: 'EXPORT',
          endpoint: 'https://api.example.com/export',
          isActive: true,
        });

        const configs = await IntegrationConfig.findActiveImports();

        expect(configs).toHaveLength(1);
        expect(configs[0].name).toBe('Active Import');
      });
    });

    describe('findActiveExports', () => {
      it('should return only active export configs', async () => {
        await IntegrationConfig.create({
          name: 'Active Export',
          type: 'EXPORT',
          endpoint: 'https://api.example.com/export',
          isActive: true,
        });
        await IntegrationConfig.create({
          name: 'Inactive Export',
          type: 'EXPORT',
          endpoint: 'https://api.example.com/export2',
          isActive: false,
        });
        await IntegrationConfig.create({
          name: 'Active Import',
          type: 'IMPORT',
          endpoint: 'https://api.example.com/import',
          isActive: true,
        });

        const configs = await IntegrationConfig.findActiveExports();

        expect(configs).toHaveLength(1);
        expect(configs[0].name).toBe('Active Export');
      });
    });

    describe('updateLastSync', () => {
      it('should update lastSync timestamp', async () => {
        const config = await IntegrationConfig.create({
          name: 'Sync Test',
          type: 'IMPORT',
          endpoint: 'https://api.example.com/data',
        });

        const syncTime = new Date('2024-01-15T10:30:00Z');
        const updated = await IntegrationConfig.updateLastSync(
          config._id.toString(),
          syncTime
        );

        expect(updated).not.toBeNull();
        expect(updated!.lastSync).toEqual(syncTime);
      });

      it('should use current time if not provided', async () => {
        const config = await IntegrationConfig.create({
          name: 'Sync Test 2',
          type: 'IMPORT',
          endpoint: 'https://api.example.com/data',
        });

        const before = new Date();
        const updated = await IntegrationConfig.updateLastSync(config._id.toString());
        const after = new Date();

        expect(updated).not.toBeNull();
        expect(updated!.lastSync!.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(updated!.lastSync!.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('should return null for non-existent config', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const updated = await IntegrationConfig.updateLastSync(fakeId);

        expect(updated).toBeNull();
      });
    });
  });
});
