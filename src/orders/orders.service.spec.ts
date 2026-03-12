import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { PUB_SUB } from 'src/common/pubsub/pubsub.provider';



const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  })),
});

const mockPubSub = () => ({
  publish: jest.fn().mockResolvedValue(true),
  asyncIterableIterator: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let restaurantRepo: any;
  let dishRepo: any;
  let pubSub: any;

  const mockCustomer: User = {
    id: 'customer-1',
    email: 'customer@test.com',
    role: UserRole.CUSTOMER,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockRepo },
        { provide: getRepositoryToken(Restaurant), useFactory: mockRepo },
        { provide: getRepositoryToken(Dish), useFactory: mockRepo },
        { provide: PUB_SUB, useFactory: mockPubSub },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get(getRepositoryToken(Order));
    restaurantRepo = module.get(getRepositoryToken(Restaurant));
    dishRepo = module.get(getRepositoryToken(Dish));
    pubSub = module.get(PUB_SUB);
  });

  describe('createOrder', () => {

    it('يجب أن يرفض الطلب إذا المطعم مغلق', async () => {
      restaurantRepo.findOne.mockResolvedValue({
        id: 'r-1',
        isOpen: false,
      });

      const result = await service.createOrder(mockCustomer, {
        restaurantId: 'r-1',
        items: [{ dishId: 'd-1', quantity: 1 }],
        deliveryAddress: 'الجزائر',
        deliveryLat: 36.7,
        deliveryLng: 3.0,
      } as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('المطعم مغلق حالياً');
    });

    it('يجب أن ينشئ طلب وينشر حدث NEW_ORDER', async () => {
      restaurantRepo.findOne.mockResolvedValue({
        id: 'r-1',
        isOpen: true,
        deliveryFee: 200,
        minOrderAmount: 0,
        owner: { id: 'owner-1' },
      });

      dishRepo.findOne.mockResolvedValue({
        id: 'd-1',
        name: 'كسكس',
        price: 800,
        isAvailable: true,
      });

      const mockOrder = { id: 'o-1', status: OrderStatus.PENDING };
      orderRepo.create.mockReturnValue(mockOrder);
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.createOrder(mockCustomer, {
        restaurantId: 'r-1',
        items: [{ dishId: 'd-1', quantity: 2 }],
        deliveryAddress: 'الجزائر',
        deliveryLat: 36.7,
        deliveryLng: 3.0,
      } as any);

      expect(result.ok).toBe(true);
      // تأكد إن PubSub نشر حدث NEW_ORDER
      expect(pubSub.publish).toHaveBeenCalledWith(
        'NEW_ORDER',
        expect.any(Object),
      );
    });
  });

  describe('updateOrderStatus', () => {

    it('يجب أن يمنع العميل من تغيير حالة الطلب', async () => {
      const customer = { id: 'c-1', role: UserRole.CUSTOMER } as User;

      orderRepo.findOne.mockResolvedValue({
        id: 'o-1',
        restaurant: { owner: { id: 'owner-1' } },
        driver: null,
        status: OrderStatus.PENDING,
      });

      const result = await service.updateOrderStatus(
        customer,
        'o-1',
        OrderStatus.ACCEPTED,
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe('غير مصرح بهذا التحديث');
    });
  });
});