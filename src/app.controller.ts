import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

@ApiTags("health")
@Controller()
export class AppController {
  @Get("health")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  healthCheck(): HealthResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  @Get()
  @ApiOperation({ summary: "Root — redirect info" })
  root(): string {
    return "Realworld API v1. Docs available at /docs";
  }
}
