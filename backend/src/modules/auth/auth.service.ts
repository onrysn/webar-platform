import { Injectable } from '@nestjs/common';

@Injectable()
export class authService {
  findAll() {
    return ['Sample auth data'];
  }
}
