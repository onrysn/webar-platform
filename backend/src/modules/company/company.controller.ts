import { Controller, Post, Body, Get, Param, Req, UseGuards, Put, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { ManageUserDto } from './dto/manageUser.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto, @Req() req: any) {
    return this.companyService.createCompany(req.user.userId, createCompanyDto.name, createCompanyDto.domain);
  }

  @Get()
  async getMyCompanies(@Req() req: any) {
    return this.companyService.getUserCompanies(req.user.userId);
  }

  @Get(':id')
  async getCompany(@Param('id') id: string, @Req() req: any) {
    return this.companyService.getCompanyById(req.user.userId, Number(id));
  }

  @Put(':id')
  async updateCompany(@Param('id') id: string, @Body() updateDto: UpdateCompanyDto, @Req() req: any) {
    return this.companyService.updateCompany(req.user.userId, Number(id), updateDto);
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string, @Req() req: any) {
    return this.companyService.deleteCompany(req.user.userId, Number(id));
  }

  @Post(':id/users')
  async addUser(@Param('id') id: string, @Body() dto: ManageUserDto, @Req() req: any) {
    return this.companyService.addUserToCompany(req.user.userId, dto.userId, Number(id), dto.role);
  }

  @Delete(':id/users/:userId')
  async removeUser(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    return this.companyService.removeUserFromCompany(req.user.userId, Number(userId), Number(id));
  }

  @Post(':id/regenerate-api-key')
  async regenerateApiKey(@Param('id') id: string, @Req() req: any) {
    return this.companyService.regenerateApiKey(req.user.userId, Number(id));
  }
}
