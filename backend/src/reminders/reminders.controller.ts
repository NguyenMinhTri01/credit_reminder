import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { QueryReminderDto } from './dto/query-reminder.dto';

@ApiTags('Reminders')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  create(@Body() createReminderDto: CreateReminderDto) {
    // TODO: Replace hardcoded userId with authenticated user ID
    const userId = 'temp-user-id';
    return this.remindersService.create(createReminderDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reminders with pagination' })
  @ApiResponse({ status: 200, description: 'List of reminders' })
  findAll(@Query() query: QueryReminderDto) {
    return this.remindersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reminder by ID' })
  @ApiResponse({ status: 200, description: 'Reminder found' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  @ApiResponse({ status: 200, description: 'Reminder updated successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.remindersService.update(id, updateReminderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  @ApiResponse({ status: 200, description: 'Reminder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.remove(id);
  }
}
