import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { QueryReminderDto } from './dto/query-reminder.dto';
import { normalizePagination, buildPaginationMeta } from '@/shared';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReminderDto: CreateReminderDto, userId: string) {
    return this.prisma.reminder.create({
      data: {
        ...createReminderDto,
        userId,
      },
    });
  }

  async findAll(query: QueryReminderDto) {
    const { page: normalizedPage, limit: normalizedLimit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.ReminderWhereInput = {};

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    if (query.frequency) {
      where.frequency = query.frequency;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip,
        take: normalizedLimit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, normalizedPage, normalizedLimit),
    };
  }

  async findOne(id: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID "${id}" not found`);
    }
    return reminder;
  }

  async update(id: string, updateReminderDto: UpdateReminderDto) {
    await this.findOne(id);

    const data: Prisma.ReminderUpdateInput = { ...updateReminderDto };
    if (updateReminderDto.nextTriggerDate) {
      data.nextTriggerDate = new Date(updateReminderDto.nextTriggerDate);
    }

    return this.prisma.reminder.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.reminder.delete({ where: { id } });
  }
}
