import { NestFactory } from "@nestjs/core";
import { ApplicationModule } from "./app.module";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { TransformResponseInterceptor } from "./common/interceptors/transform-response.interceptor";
import { AppValidationPipe } from "./common/pipes/app-validation.pipe";
import { TrimStringsPipe } from "./common/pipes/trim-strings.pipe";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApplicationModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new TrimStringsPipe(), new AppValidationPipe());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new TransformResponseInterceptor(),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

/*

*/
