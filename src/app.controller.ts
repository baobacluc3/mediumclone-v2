import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

@Controller()
export class AppController {
  @Get("health")
  @HttpCode(HttpStatus.OK)
  healthCheck(): HealthResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  @Get()
  root(): string {
    return "Publishing API v1";
  }
}
