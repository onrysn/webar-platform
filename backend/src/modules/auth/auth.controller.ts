import { Controller, Get } from '@nestjs/common';
import { authService } from './auth.service';

@Controller('auth')
export class authController {
  constructor(private readonly service: authService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
