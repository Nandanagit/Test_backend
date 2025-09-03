import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import 'dotenv/config';
import { AiModule } from './ai/ai.module';

async function bootstrap() {
  const app = (await NestFactory.create(AppModule)) as NestExpressApplication;

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Snavy API Docs')
    .setDescription('The API documentation for the Snavy project')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Enable CORS
  app.enableCors();
  const port = process.env.PORT ?? 6002;
  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
}

bootstrap();
