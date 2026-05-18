import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

@Controller("health")
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  healthCheck(): HealthResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }
}
