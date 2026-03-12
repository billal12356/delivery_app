import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';



const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

// مستخدم وهمي للاختبارات
const mockOwner: User = {
  id: 'owner-1',
  email: 'owner@test.com',
  role: UserRole.OWNER,
} as User;

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let restaurantRepo: any;
  let categoryRepo: any;
  let dishRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: getRepositoryToken(Restaurant), useFactory: mockRepo },
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
        { provide: getRepositoryToken(Dish), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    restaurantRepo = module.get(getRepositoryToken(Restaurant));
    categoryRepo = module.get(getRepositoryToken(Category));
    dishRepo = module.get(getRepositoryToken(Dish));
  });

  describe('createRestaurant', () => {

    it('يجب أن ينشئ مطعم بنجاح', async () => {
      const input = {
        name: 'مطعم الأصالة',
        address: 'الجزائر',
        lat: 36.7,
        lng: 3.0,
        deliveryFee: 200,
        minOrderAmount: 500,
        estimatedDeliveryTime: 30,
      };

      const mockRestaurant = { id: 'r-1', ...input, owner: mockOwner };
      restaurantRepo.create.mockReturnValue(mockRestaurant);
      restaurantRepo.save.mockResolvedValue(mockRestaurant);

      const result = await service.createRestaurant(mockOwner, input as any);

      expect(result.ok).toBe(true);
      expect(result.restaurant).toBeDefined();
    //   expect(result.restaurant.name).toBe('مطعم الأصالة ' ) ;
    });
  });

  describe('updateRestaurant', () => {

    it('يجب أن يرفض تعديل مطعم لا يملكه', async () => {
      const otherOwner = { id: 'other-owner', role: UserRole.OWNER } as User;
      const mockRestaurant = {
        id: 'r-1',
        owner: { id: 'owner-1' },
      };

      restaurantRepo.findOne.mockResolvedValue(mockRestaurant);

      const result = await service.updateRestaurant(
        otherOwner,
        'r-1',
        { name: 'اسم جديد' } as any,
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe('لا تملك صلاحية تعديل هذا المطعم');
    });
  });
});