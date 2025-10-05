import { Controller, Get } from '@nestjs/common';
import { userService } from './user.service';

@Controller('user')
export class userController {
  constructor(private readonly service: userService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
