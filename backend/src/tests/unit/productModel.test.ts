import mongoose from 'mongoose';
import { Product } from '../../models/Product.js';

describe('Product Model', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('create', () => {
    it('should create a product with required fields', async () => {
      const productData = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 99.99,
      };

      const product = await Product.create(productData);

      expect(product.productId).toBe('prod-001');
      expect(product.name).toBe('Test Product');
      expect(product.category).toBe('Electronics');
      expect(product.price).toBe(99.99);
      expect(product.currency).toBe('USD');
    });

    it('should create a product with all fields', async () => {
      const productData = {
        productId: 'prod-002',
        name: 'Premium Product',
        category: 'Electronics',
        subcategory: 'Smartphones',
        price: 999.99,
        currency: 'EUR',
        imageUrl: 'https://example.com/image.jpg',
        attributes: { color: 'black', storage: '128GB' },
      };

      const product = await Product.create(productData);

      expect(product.subcategory).toBe('Smartphones');
      expect(product.currency).toBe('EUR');
      expect(product.imageUrl).toBe('https://example.com/image.jpg');
      expect(product.attributes).toEqual({ color: 'black', storage: '128GB' });
    });

    it('should fail without required productId', async () => {
      const productData = {
        name: 'Test Product',
        category: 'Electronics',
        price: 99.99,
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail without required name', async () => {
      const productData = {
        productId: 'prod-003',
        category: 'Electronics',
        price: 99.99,
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail without required category', async () => {
      const productData = {
        productId: 'prod-004',
        name: 'Test Product',
        price: 99.99,
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail without required price', async () => {
      const productData = {
        productId: 'prod-005',
        name: 'Test Product',
        category: 'Electronics',
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail with negative price', async () => {
      const productData = {
        productId: 'prod-006',
        name: 'Test Product',
        category: 'Electronics',
        price: -10,
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should enforce unique productId', async () => {
      const productData = {
        productId: 'prod-007',
        name: 'Test Product',
        category: 'Electronics',
        price: 99.99,
      };

      await Product.create(productData);
      // Ensure indexes are synced before testing unique constraint
      await Product.syncIndexes();
      await expect(Product.create(productData)).rejects.toThrow();
    });
  });

  describe('findByProductId', () => {
    it('should find product by productId', async () => {
      await Product.create({
        productId: 'prod-find-001',
        name: 'Findable Product',
        category: 'Electronics',
        price: 50,
      });

      const product = await Product.findByProductId('prod-find-001');

      expect(product).not.toBeNull();
      expect(product!.name).toBe('Findable Product');
    });

    it('should return null for non-existent productId', async () => {
      const product = await Product.findByProductId('non-existent');

      expect(product).toBeNull();
    });
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      await Product.create({
        productId: 'prod-cat-001',
        name: 'Product 1',
        category: 'Books',
        price: 20,
      });
      await Product.create({
        productId: 'prod-cat-002',
        name: 'Product 2',
        category: 'Books',
        price: 25,
      });
      await Product.create({
        productId: 'prod-cat-003',
        name: 'Product 3',
        category: 'Electronics',
        price: 100,
      });

      const products = await Product.findByCategory('Books');

      expect(products).toHaveLength(2);
      expect(products.every((p) => p.category === 'Books')).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const products = await Product.findByCategory('NonExistent');

      expect(products).toHaveLength(0);
    });
  });
});
