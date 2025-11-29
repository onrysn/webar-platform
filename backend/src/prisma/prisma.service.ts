import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private softDeleteModels = ['User', 'Company', 'UserCompany', 'ARModel', 'ARScene'];

  constructor() {
    super({ log: ['query'] });
  }

  async onModuleInit() {
    await this.$connect();
    this.$extends(this.createSoftDeleteExtension());
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private createSoftDeleteExtension() {
    const softDeleteModels = this.softDeleteModels;

    return {
      name: 'softDelete',
      query: {
        $allModels: {
          async findMany({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, isDeleted: false };
            }
            return query(args);
          },
          async findFirst({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, isDeleted: false };
            }
            return query(args);
          },
          async findUnique({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, isDeleted: false };
            }
            return query(args);
          },
          async delete({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              // @ts-ignore - dynamic model update
              return this[model].update({
                where: args.where,
                data: { isDeleted: true },
              });
            }
            return query(args);
          },
          async deleteMany({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              // @ts-ignore - dynamic model update
              return this[model].updateMany({
                where: { ...args.where, isDeleted: false },
                data: { isDeleted: true },
              });
            }
            return query(args);
          },
        },
      },
    };
  }

  get inclusive() {
    return this.$extends({
      name: 'inclusive',
      query: {
        $allModels: {
          findMany({ args, query }) {
            return query(args);
          },
          findFirst({ args, query }) {
            return query(args);
          },
          findUnique({ args, query }) {
            return query(args);
          },
        },
      },
    });
  }

  get deleted() {
    const softDeleteModels = this.softDeleteModels;
    return this.$extends({
      name: 'deleted',
      query: {
        $allModels: {
          async findMany({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, isDeleted: true };
            }
            return query(args);
          },
          async findFirst({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, isDeleted: true };
            }
            return query(args);
          },
          async findUnique({ args, query, model }) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, isDeleted: true };
            }
            return query(args);
          },
        },
      },
    });
  }
}
