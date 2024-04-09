import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedProducts } from 'src/interfaces';
import { UserDocument } from 'src/users/schemas/user.schema';
import { sampleProduct } from '../../utils/data/product';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) public productModel: Model<ProductDocument>
  ) { }

  async findTopRated(): Promise<ProductDocument[]> {
    const products = await this.productModel
      .find({})
      .sort({ rating: -1 })// esto no me sirve
      .limit(3);

    if (!products.length) throw new NotFoundException('No products found.');

    return products;
  }

  async findMany(pageId: string, filter?: FilterQuery<ProductDocument>): Promise<ProductDocument[] | PaginatedProducts> {
    const pageSize = 2;
    const page = parseInt(pageId) || 1;
    if (!filter) {
      // Si no se proporciona un filtro busca todos los productos
      const products = await this.productModel.find();
      if (!products.length) throw new NotFoundException('No products found.');
      return products;
    }

    const query: FilterQuery<ProductDocument> = {};
    if (filter.keyword) {
      query.name = { $regex: new RegExp(filter.keyword, 'i') }
    }
    if (filter.category) {
      query.category = filter.category
    }
    if (filter.brand) {
      query.brand = filter.brand;
    }
    const count = await this.productModel.countDocuments(query);
    const products = await this.productModel
      .find(query)
      .limit(pageSize)
      .skip(pageSize * (page - 1));;

    if (!products.length) throw new NotFoundException('No products found.');
    return { products, page, pages: Math.ceil(count / pageSize) };
  }

  async findById(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);

    if (!product) throw new NotFoundException('No product with given ID.');

    return product;
  }

  async createMany(
    products: Partial<ProductDocument>[]
  ): Promise<ProductDocument[]> {
    const createdProducts = await this.productModel.insertMany(products);

    return createdProducts;
  }

  async createSample(): Promise<ProductDocument> {
    const createdProduct = await this.productModel.create(sampleProduct);

    return createdProduct;
  }

  async update(
    id: string,
    attrs: Partial<ProductDocument>
  ): Promise<ProductDocument> {
    const { name, price, description, image, brand, category, countInStock } =
      attrs;
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('No product with given ID.');

    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();

    return updatedProduct;
  }

  async createReview(
    id: string,
    user: Partial<UserDocument>,
    rating: number,
    comment: string
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);

    if (!product) throw new NotFoundException('No product with given ID.');

    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === user._id.toString()
    );

    if (alreadyReviewed)
      throw new BadRequestException('Product already reviewed!');

    const review = {
      name: user.name,
      rating,
      comment,
      user: user._id,
    };

    product.reviews.push(review);

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    product.numReviews = product.reviews.length;

    const updatedProduct = await product.save();

    return updatedProduct;
  }

  async deleteOne(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);

    if (!product) throw new NotFoundException('No product with given ID.');

    await product.remove();
  }

  async deleteMany(): Promise<void> {
    await this.productModel.deleteMany({});
  }
  
  async getAllCategories(): Promise<string[]> {
    const categories = await this.productModel.distinct('category').exec();
    return categories;
  }
  async getAllBrands(): Promise<string[]> {
    const categories = await this.productModel.distinct('brand').exec();
    return categories;
  }
}
