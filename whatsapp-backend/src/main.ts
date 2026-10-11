import * as dns from 'dns';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Configure DNS to resolve MongoDB Atlas SRV records reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('WhatsApp Clone API')
    .setDescription(
      'REST & Real-time API documentation for WhatsApp Clone with MongoDB Atlas',
    )
    .setVersion('1.0')
    .addTag('Users', 'User profile management & device contact sync')
    .addTag('Chat', 'Chat history & conversations')
    .addTag('Auth', 'OTP-based phone authentication')
    .addTag('App', 'General health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'WhatsApp API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 1,
      docExpansion: 'list',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend is running on port ${port}`);
  console.log(
    `📑 Swagger Documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
