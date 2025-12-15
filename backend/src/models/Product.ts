import mongoose, { Schema, Document, Model } from 'mongoose';
import { IProduct } from '../types/index.js';

export interface IProductDocument extends Omit<IProduct, '_id'>, Document {}

const productSchema = new Schema<IProductDocument>(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    imageUrl: {
      type: String,
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Text index for search
productSchema.index({ name: 'text', category: 'text', subcategory: 'text' });

// Compound indexes
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1, category: 1 });

// Static methods
productSchema.statics.findByProductId = function (productId: string) {
  return this.findOne({ productId });
};

productSchema.statics.findByCategory = function (category: string) {
  return this.find({ category });
};

productSchema.statics.search = function (query: string, limit: number = 20) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

export interface IProductModel extends Model<IProductDocument> {
  findByProductId(productId: string): Promise<IProductDocument | null>;
  findByCategory(category: string): Promise<IProductDocument[]>;
  search(query: string, limit?: number): Promise<IProductDocument[]>;
}

export const Product = mongoose.model<IProductDocument, IProductModel>(
  'Product',
  productSchema
);
