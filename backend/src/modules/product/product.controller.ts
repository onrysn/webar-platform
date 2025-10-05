import { Controller, Get } from '@nestjs/common';
import { productService } from './product.service';

@Controller('product')
export class productController {
  constructor(private readonly service: productService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
