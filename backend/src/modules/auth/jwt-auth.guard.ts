import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator'; // Yolunuza göre düzenleyin

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. O an çalışacak olan Handler (metot) veya Class üzerinde 'isPublic' etiketi var mı?
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Eğer @Public() varsa, JWT kontrolünü hiç yapmadan TRUE dön (Kapıdan geçir)
    if (isPublic) {
      return true;
    }

    // 3. Değilse standart Passport JWT kontrolünü çalıştır
    return super.canActivate(context);
  }
}