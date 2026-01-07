import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: number;
  email: string;
  role: string;
  companyId: number | null;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);