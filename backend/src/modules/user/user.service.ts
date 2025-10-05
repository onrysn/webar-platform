import { Injectable } from '@nestjs/common';

@Injectable()
export class userService {
  findAll() {
    return ['Sample user data'];
  }
}
