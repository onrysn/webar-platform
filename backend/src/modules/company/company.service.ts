import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async createCompany(name: string, domain: string) {
    const apiKey = uuidv4(); // Benzersiz API key üret
    const company = await this.prisma.company.create({
      data: { name, domain, apiKey },
    });
    return company;
  }

  async getCompanyById(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { users: { include: { user: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async addUserToCompany(userId: number, companyId: number, role = 'member') {
    return this.prisma.userCompany.create({
      data: { userId, companyId, role },
    });
  }

  async getUserCompanies(userId: number) {
    return this.prisma.userCompany.findMany({
      where: { userId },
      include: { company: true },
    });
  }
}
