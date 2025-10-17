import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  async createCompany(@Body() body: { name: string; domain: string }, @Req() req: any) {
    const company = await this.companyService.createCompany(body.name, body.domain);
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
