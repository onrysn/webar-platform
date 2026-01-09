import { Controller, Get, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users') // Endpoint adı genelde çoğul olur
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1. KULLANICI LİSTELEME
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Kullanıcıları listeler (Role duyarlı)' })
  @ApiQuery({ name: 'companyId', required: false, type: Number, description: 'Sadece Super Admin kullanabilir' })
  findAll(
    @User() user: CurrentUser,
    @Query('companyId') queryCompanyId?: string
  ) {
    // Super Admin filtreleme yapmak isterse
    const filterCompanyId = queryCompanyId ? Number(queryCompanyId) : undefined;
    return this.userService.findAll(user, filterCompanyId);
  }

  // 2. TEK KULLANICI DETAYI
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Kullanıcı detayını getirir' })
  findOne(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(user, id);
  }

  // 3. KULLANICI GÜNCELLEME
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Kullanıcı bilgilerini günceller' })
  update(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.update(user, id, updateUserDto);
  }

  // 4. KULLANICI SİLME (Soft Delete)
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Kullanıcıyı siler/pasife alır' })
  remove(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(user, id);
  }
}