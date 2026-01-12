import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Yeni kullanıcı ve şirket kaydı' })
  @ApiResponse({ status: 201, description: 'Kullanıcı ve Şirket oluşturuldu' })
  async register(@Body() registerDto: RegisterDto) {
    // Register mantığı yeni şemaya göre AuthService içinde güncellenmelidir.
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  @ApiResponse({ status: 200, description: 'Giriş başarılı, JWT döner' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Token ile mevcut kullanıcı bilgisini getirir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı bilgisi döner' })
  async me(@User() user: CurrentUser) { // <-- Revize edilen kısım
    // Artık req.user.userId yerine tip güvenli user.id kullanıyoruz
    return this.authService.me(user.id);
  }
}