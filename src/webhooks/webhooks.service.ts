import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './webhook.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAYS = [60, 300, 900];

  constructor(private readonly prisma: PrismaService) {}

  async create(_userId: string, _dto: CreateWebhookDto) {
    throw new Error('Webhooks module not yet implemented - missing Prisma models');
  }

  async findAll(_userId: string) {
    return [];
  }

  async findOne(_id: string, _userId: string) {
    throw new NotFoundException('Webhook not found');
  }

  async update(_id: string, _userId: string, _dto: UpdateWebhookDto) {
    throw new NotFoundException('Webhook not found');
  }

  async remove(_id: string, _userId: string) {
    throw new NotFoundException('Webhook not found');
  }

  async trigger(_eventType: string, _payload: object) {
    this.logger.warn('Webhook trigger called but webhooks module not yet implemented');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async retryFailedDeliveries() {
    // No-op: webhooks module not yet implemented
  }

  async getDeliveries(_webhookId: string, _userId: string) {
    return [];
  }

  private sign(_body: string, _secret: string): string {
    return '';
  }
}
