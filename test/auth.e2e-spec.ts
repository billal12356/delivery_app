import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';  // ← غيّر من * as request إلى default import
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const gql = '/graphql';

  describe('Register', () => {

    it('يجب أن يسجل مستخدم جديد', () => {
      return supertest(app.getHttpServer())  // ← غيّر request لـ supertest
        .post(gql)
        .send({
          query: `
            mutation {
              register(input: {
                email: "e2e@test.com"
                password: "123456"
                role: CUSTOMER
              }) {
                ok
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.register.ok).toBe(true);
        });
    });

    it('يجب أن يرفض الإيميل المكرر', () => {
      return supertest(app.getHttpServer())
        .post(gql)
        .send({
          query: `
            mutation {
              register(input: {
                email: "e2e@test.com"
                password: "123456"
                role: CUSTOMER
              }) {
                ok
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.register.ok).toBe(false);
          expect(res.body.data.register.error).toBeDefined();
        });
    });
  });

  describe('Login', () => {

    it('يجب أن يرجع token عند بيانات صحيحة', () => {
      return supertest(app.getHttpServer())
        .post(gql)
        .send({
          query: `
            mutation {
              login(input: {
                email: "e2e@test.com"
                password: "123456"
              }) {
                ok
                accessToken
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login.ok).toBe(true);
          expect(res.body.data.login.accessToken).toBeDefined();
        });
    });
  });
});