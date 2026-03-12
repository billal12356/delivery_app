import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //coockie parser
  app.use(cookieParser());

   // Global Validation 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,     
      forbidNonWhitelisted: true,
      transform: true,       
    }),
  ); 

  // CORS 
  app.enableCors({
    origin: 'http://localhost:4200', 
    credentials: true,               
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on: http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}
bootstrap();
