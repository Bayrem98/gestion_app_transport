import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Global validation
  app.useGlobalPipes(new ValidationPipe());
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('🚀 Application backend démarrée sur http://localhost:3000');
}
bootstrap();