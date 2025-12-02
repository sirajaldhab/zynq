import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(cookieParser());

  const logger = new Logger('Bootstrap');
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const port = process.env.PORT || 8443;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
