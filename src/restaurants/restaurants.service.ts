import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { User, UserRole } from '../users/entities/user.entity';

import { CreateRestaurantInput } from './dto/create-restaurant.dto';
import { UpdateRestaurantInput } from './dto/update-restaurant.dto';
import { CreateCategoryInput } from './dto/create-category.dto';
import { CreateDishInput } from './dto/create-dish.dto';
import { UpdateDishInput } from './dto/update-dish.dto';
import {
  RestaurantOutput, RestaurantsOutput,
  CategoryOutput, DishOutput,
} from './dto/restaurants-output.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
  ) {}

  // ─── إنشاء مطعم جديد ─────────────────────────────────────
  async createRestaurant(
    owner: User,
    input: CreateRestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = this.restaurantRepo.create({
        ...input,
        owner,
        // نربط المطعم بصاحبه تلقائياً من الـ JWT
      });
      const saved = await this.restaurantRepo.save(restaurant);
      return { ok: true, restaurant: saved };
    } catch {
      return { ok: false, error: 'فشل إنشاء المطعم' };
    }
  }

  // ─── جلب كل المطاعم ──────────────────────────────────────
  async getAllRestaurants(): Promise<RestaurantsOutput> {
    try {
      const restaurants = await this.restaurantRepo.find({
        relations: ['owner', 'categories'],
        order: { createdAt: 'DESC' },
      });
      return { ok: true, restaurants };
    } catch {
      return { ok: false, error: 'فشل جلب المطاعم' };
    }
  }

  // ─── جلب مطعم بالـ ID ────────────────────────────────────
  async getRestaurantById(id: string): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne({
        where: { id },
        relations: ['owner', 'categories', 'categories.dishes'],
        // جلب كل البيانات المتعلقة بالمطعم دفعة واحدة
      });

      if (!restaurant) {
        return { ok: false, error: 'المطعم غير موجود' };
      }

      return { ok: true, restaurant };
    } catch {
      return { ok: false, error: 'فشل جلب المطعم' };
    }
  }

  // ─── جلب مطعم صاحبه (للـ Owner) ──────────────────────────
  async getMyRestaurant(owner: User): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne({
        where: { owner: { id: owner.id } },
        relations: ['categories', 'categories.dishes'],
      });

      if (!restaurant) {
        return { ok: false, error: 'لم تقم بإنشاء مطعم بعد' };
      }

      return { ok: true, restaurant };
    } catch {
      return { ok: false, error: 'فشل جلب بيانات مطعمك' };
    }
  }

  // ─── تحديث بيانات المطعم ─────────────────────────────────
  async updateRestaurant(
    owner: User,
    restaurantId: string,
    input: UpdateRestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: restaurantId },
        relations: ['owner'],
      });

      if (!restaurant) {
        return { ok: false, error: 'المطعم غير موجود' };
      }

      // تأكد إن صاحب المطعم هو من يعدل — ليس أي Owner آخر
      if (restaurant.owner.id !== owner.id) {
        return { ok: false, error: 'لا تملك صلاحية تعديل هذا المطعم' };
      }

      const updated = await this.restaurantRepo.save({
        ...restaurant,
        ...input,
        // spread operator يدمج البيانات الجديدة مع القديمة
      });

      return { ok: true, restaurant: updated };
    } catch {
      return { ok: false, error: 'فشل تحديث المطعم' };
    }
  }

  // ─── حذف مطعم ────────────────────────────────────────────
  async deleteRestaurant(
    owner: User,
    restaurantId: string,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: restaurantId },
        relations: ['owner'],
      });

      if (!restaurant) {
        return { ok: false, error: 'المطعم غير موجود' };
      }

      if (restaurant.owner.id !== owner.id) {
        return { ok: false, error: 'لا تملك صلاحية حذف هذا المطعم' };
      }

      await this.restaurantRepo.remove(restaurant);
      return { ok: true };
    } catch {
      return { ok: false, error: 'فشل حذف المطعم' };
    }
  }

  // ─── إنشاء تصنيف ─────────────────────────────────────────
  async createCategory(
    owner: User,
    input: CreateCategoryInput,
  ): Promise<CategoryOutput> {
    try {
      // تأكد إن المطعم ملك هذا الـ owner
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: input.restaurantId, owner: { id: owner.id } },
      });

      if (!restaurant) {
        return { ok: false, error: 'المطعم غير موجود أو لا تملكه' };
      }

      const category = this.categoryRepo.create({
        name: input.name,
        coverImage: input.coverImage,
        restaurant,
      });

      const saved = await this.categoryRepo.save(category);
      return { ok: true, category: saved };
    } catch {
      return { ok: false, error: 'فشل إنشاء التصنيف' };
    }
  }

  // ─── إنشاء صنف في القائمة ────────────────────────────────
  async createDish(
    owner: User,
    input: CreateDishInput,
  ): Promise<DishOutput> {
    try {
      // تأكد إن التصنيف ينتمي لمطعم هذا الـ owner
      const category = await this.categoryRepo.findOne({
        where: { id: input.categoryId },
        relations: ['restaurant', 'restaurant.owner'],
      });

      if (!category) {
        return { ok: false, error: 'التصنيف غير موجود' };
      }

      if (category.restaurant.owner.id !== owner.id) {
        return { ok: false, error: 'لا تملك صلاحية إضافة أصناف لهذا التصنيف' };
      }

      const dish = this.dishRepo.create({
        name: input.name,
        description: input.description,
        price: input.price,
        photo: input.photo,
        category,
      });

      const saved = await this.dishRepo.save(dish);
      return { ok: true, dish: saved };
    } catch {
      return { ok: false, error: 'فشل إنشاء الصنف' };
    }
  }

  // ─── تحديث صنف ───────────────────────────────────────────
  async updateDish(
    owner: User,
    dishId: string,
    input: UpdateDishInput,
  ): Promise<DishOutput> {
    try {
      const dish = await this.dishRepo.findOne({
        where: { id: dishId },
        relations: ['category', 'category.restaurant', 'category.restaurant.owner'],
      });

      if (!dish) {
        return { ok: false, error: 'الصنف غير موجود' };
      }

      if (dish.category.restaurant.owner.id !== owner.id) {
        return { ok: false, error: 'لا تملك صلاحية تعديل هذا الصنف' };
      }

      const updated = await this.dishRepo.save({ ...dish, ...input });
      return { ok: true, dish: updated };
    } catch {
      return { ok: false, error: 'فشل تحديث الصنف' };
    }
  }

  // ─── تفعيل/تعطيل صنف ─────────────────────────────────────
  async toggleDishAvailability(
    owner: User,
    dishId: string,
  ): Promise<DishOutput> {
    try {
      const dish = await this.dishRepo.findOne({
        where: { id: dishId },
        relations: ['category', 'category.restaurant', 'category.restaurant.owner'],
      });

      if (!dish) return { ok: false, error: 'الصنف غير موجود' };

      if (dish.category.restaurant.owner.id !== owner.id) {
        return { ok: false, error: 'غير مصرح' };
      }

      dish.isAvailable = !dish.isAvailable;
      const updated = await this.dishRepo.save(dish);
      return { ok: true, dish: updated };
    } catch {
      return { ok: false, error: 'فشل تحديث الصنف' };
    }
  }

  // ─── البحث عن مطاعم قريبة ────────────────────────────────
  async getNearbyRestaurants(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<RestaurantsOutput> {
    try {
      // Haversine formula — حساب المسافة بين نقطتين جغرافيتين
      const restaurants = await this.restaurantRepo
        .createQueryBuilder('restaurant')
        .where('restaurant.isOpen = true')
        .andWhere(
          `(
            6371 * acos(
              cos(radians(:lat)) * cos(radians(restaurant.lat)) *
              cos(radians(restaurant.lng) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(restaurant.lat))
            )
          ) < :radius`,
          { lat, lng, radius: radiusKm },
        )
        .leftJoinAndSelect('restaurant.owner', 'owner')
        .leftJoinAndSelect('restaurant.categories', 'categories')
        .getMany();

      return { ok: true, restaurants };
    } catch {
      return { ok: false, error: 'فشل البحث عن المطاعم' };
    }
  }
}