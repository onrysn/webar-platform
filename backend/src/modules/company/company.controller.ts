import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCompanyDto } from './dto/createCompany.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto, @Req() req: any) {
    console.log('req.user:', req.user);
    console.log('req.create:', createCompanyDto);
    const company = await this.companyService.createCompany(createCompanyDto.name, createCompanyDto.domain);
    // Oluşturan kullanıcıyı otomatik ekle (admin)
    await this.companyService.addUserToCompany(req.user.userId, company.id, 'admin');
    return company;
  }

  @Get()
  async getMyCompanies(@Req() req: any) {
    return this.companyService.getUserCompanies(req.user.userId);
  }

  @Get(':id')
  async getCompany(@Param('id') id: string) {
    return this.companyService.getCompanyById(Number(id));
  }
}
