import { Controller, Post, Body, Get, Param, UseGuards, Put, Delete, ParseIntPipe, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { AddUserToCompanyDto } from './dto/add-user.dto';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';

@UseGuards(JwtAuthGuard, RolesGuard, CompanyActiveGuard)
@ApiBearerAuth('access-token')
@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) { }

  // =================================================================
  // 1. ŞİRKET YÖNETİMİ (SUPER ADMIN)
  // =================================================================

  @Post()
  @Roles(Role.SUPER_ADMIN) // Sadece Süper Admin manuel şirket oluşturabilir
  @ApiOperation({ summary: 'Yeni bir şirket oluşturur (Sadece Super Admin)' })
  async createCompany(@User() user: CurrentUser, @Body() dto: CreateCompanyDto) {
    return this.companyService.createCompany(user, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN) // Sadece Süper Admin tüm listeyi görebilir
  @ApiOperation({ summary: 'Tüm şirketleri listeler (Sadece Super Admin)' })
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  // =================================================================
  // 2. KENDİ ŞİRKETİM (COMPANY ADMIN & EDITOR & MEMBER)
  // =================================================================

  @Get('my-company')
  @ApiOperation({ summary: 'Kullanıcının bağlı olduğu şirketin detaylarını getirir' })
  async getMyCompany(@User() user: CurrentUser) {
    if (!user.companyId) {
      // Super Admin'in şirketi olmayabilir
      if (user.role === Role.SUPER_ADMIN) return { message: 'Super Admin, bir şirkete bağlı değil.' };
      throw new BadRequestException('Bir şirkete bağlı değilsiniz.');
    }
    return this.companyService.getCompanyById(user.companyId);
  }

  @Put('my-company')
  @Roles(Role.COMPANY_ADMIN) // Sadece Şirket Yöneticisi güncelleyebilir
  @ApiOperation({ summary: 'Kullanıcının kendi şirket bilgilerini günceller' })
  async updateMyCompany(@User() user: CurrentUser, @Body() updateDto: UpdateCompanyDto) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    const { isActive, subscriptionEndsAt, ...safeDto } = updateDto;
    return this.companyService.updateCompany(user, user.companyId, safeDto);
  }

  @Post('my-company/regenerate-api-key')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Şirketin API anahtarını yeniler' })
  async regenerateApiKey(@User() user: CurrentUser) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    // Yeni ApiKey kaydı oluştur (limit kontrolü ile)
    return this.companyService.createApiKey(user, user.companyId, { name: 'Primary Key' });
  }

  // --- MY COMPANY API KEYS (Company Admin) ---
  @Get('my-company/api-keys')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Kendi şirketinin API anahtarlarını listeler' })
  async listMyCompanyApiKeys(@User() user: CurrentUser) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    return this.companyService.listApiKeys(user.companyId);
  }

  @Post('my-company/api-keys')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Kendi şirketine yeni API anahtarı oluşturur' })
  async createMyCompanyApiKey(@User() user: CurrentUser, @Body() body: any) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    return this.companyService.createApiKey(user, user.companyId, body);
  }

  @Put('my-company/api-keys/:keyId')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Kendi şirketine ait API anahtarını günceller' })
  async updateMyCompanyApiKey(@User() user: CurrentUser, @Param('keyId', ParseIntPipe) keyId: number, @Body() body: any) {
    return this.companyService.updateApiKey(user, keyId, body);
  }

  @Delete('my-company/api-keys/:keyId')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Kendi şirketine ait API anahtarını siler' })
  async deleteMyCompanyApiKey(@User() user: CurrentUser, @Param('keyId', ParseIntPipe) keyId: number) {
    return this.companyService.deleteApiKey(user, keyId);
  }

  // =================================================================
  // 3. ŞİRKET KULLANICILARINI YÖNETME (USER MANAGEMENT)
  // =================================================================

  @Get('my-company/users')
  @Roles(Role.COMPANY_ADMIN, Role.EDITOR) // Yöneticiler ve belki Editörler ekibi görebilir
  @ApiOperation({ summary: 'Şirketteki kullanıcıları listeler' })
  async getCompanyUsers(@User() user: CurrentUser) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    return this.companyService.getCompanyUsers(user.companyId);
  }

  @Post('my-company/users')
  @Roles(Role.COMPANY_ADMIN) // Sadece yönetici yeni eleman ekleyebilir
  @ApiOperation({ summary: 'Şirkete yeni bir alt kullanıcı (Editor/Member) ekler' })
  async addUser(@User() user: CurrentUser, @Body() dto: AddUserToCompanyDto) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    // Burada "UserCompany" tablosuna ekleme değil, User tablosuna create işlemi yapılacak
    return this.companyService.createSubUser(user, dto);
  }

  @Delete('my-company/users/:targetUserId')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Şirketten bir kullanıcıyı siler/pasife alır' })
  async removeUser(
    @User() user: CurrentUser,
    @Param('targetUserId', ParseIntPipe) targetUserId: number
  ) {
    if (!user.companyId) throw new BadRequestException('Şirket bulunamadı');
    return this.companyService.removeUserFromCompany(user, targetUserId);
  }

  // =================================================================
  // 4. GENEL/SUPER ADMIN İŞLEMLERİ (ID BAZLI)
  // =================================================================

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'ID ile şirket detayı (Super Admin)' })
  async getCompanyById(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.getCompanyById(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şirketi tamamen siler/arşivler (Super Admin)' })
  async deleteCompany(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.companyService.deleteCompany(user, id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şirket bilgilerini günceller (Super Admin)' })
  async updateCompanyById(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto
  ) {
    return this.companyService.updateCompany(user, id, dto);
  }

  @Post(':id/users')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Belirli bir şirkete kullanıcı ekler (Super Admin)' })
  async addUserToCompany(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) companyId: number,
    @Body() dto: AddUserToCompanyDto
  ) {
    return this.companyService.createSubUser(user, dto, companyId);
  }

  @Delete(':id/users/:targetUserId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Belirli bir şirketten kullanıcı siler (Super Admin)' })
  async removeUserFromCompany(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) companyId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number
  ) {
    return this.companyService.removeUserFromCompany(user, targetUserId, companyId);
  }

  @Post(':id/regenerate-api-key')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Belirli bir şirketin API anahtarını yeniler (Super Admin)' })
  async regenerateCompanyApiKey(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) companyId: number
  ) {
    return this.companyService.createApiKey(user, companyId, { name: 'Primary Key' });
  }

  // --- API KEY MANAGEMENT (Super Admin) ---
  @Get(':id/api-keys')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şirketin API anahtarlarını listeler (Super Admin)' })
  async listCompanyApiKeys(@Param('id', ParseIntPipe) companyId: number) {
    return this.companyService.listApiKeys(companyId);
  }

  @Post(':id/api-keys')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şirket için yeni API anahtarı oluşturur (Super Admin)' })
  async createCompanyApiKey(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) companyId: number,
    @Body() body: { name?: string; description?: string; allowedOrigins?: string[]; allowedDomains?: string[]; permissions?: any; rateLimit?: number | null; rateLimitWindow?: number | null; expiresAt?: Date | null }
  ) {
    return this.companyService.createApiKey(user, companyId, body);
  }

  @Delete('api-keys/:keyId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'API anahtarını siler (Super Admin)' })
  async deleteApiKey(@User() user: CurrentUser, @Param('keyId', ParseIntPipe) keyId: number) {
    return this.companyService.deleteApiKey(user, keyId);
  }

  @Put('api-keys/:keyId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'API anahtarı ayarlarını günceller (Super Admin)' })
  async updateApiKey(
    @User() user: CurrentUser,
    @Param('keyId', ParseIntPipe) keyId: number,
    @Body() body: { name?: string; description?: string; allowedOrigins?: string[]; allowedDomains?: string[]; permissions?: any; rateLimit?: number | null; rateLimitWindow?: number | null; isActive?: boolean; expiresAt?: Date | null }
  ) {
    return this.companyService.updateApiKey(user, keyId, body);
  }

  // --- LIMITS (Super Admin) ---
  @Put(':id/limits')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şirket limitlerini günceller (maxApiKeys, maxStorage) (Super Admin)' })
  async updateCompanyLimits(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) companyId: number,
    @Body() body: { maxApiKeys?: number | null; maxStorage?: number | null }
  ) {
    return this.companyService.updateCompanyLimits(user, companyId, body);
  }
}