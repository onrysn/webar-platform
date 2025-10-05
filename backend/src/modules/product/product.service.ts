import { Injectable } from '@nestjs/common';

@Injectable()
export class productService {
  findAll() {
    return ['Sample product data'];
  }
}
