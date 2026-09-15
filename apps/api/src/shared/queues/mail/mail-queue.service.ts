import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name)

  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}

  /**
   * Đẩy job gửi email thông báo vào hàng đợi
   */
  async sendNotification(to: string, subject: string, content: string) {
    this.logger.log(`[BullMQ Producer] Queuing notification email to ${to}`)
    return await this.mailQueue.add(
      'notification',
      { to, subject, content },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    )
  }

  /**
   * Đẩy job gửi email thông báo đơn hàng vào hàng đợi
   */
  async sendOrderNotification(
    to: string,
    payload: {
      orderId: string
      customerName: string
      items: { name: string; quantity: number; price: number }[]
      total: number
      status: string
      orderUrl: string
    },
  ) {
    this.logger.log(`[BullMQ Producer] Queuing order notification email for order #${payload.orderId}`)
    return await this.mailQueue.add(
      'order-notification',
      { to, payload },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    )
  }

  /**
   * Đẩy job gửi email mã OTP vào hàng đợi
   */
  async sendOTP(email: string, code: string) {
    this.logger.log(`[BullMQ Producer] Queuing OTP email to ${email}`)
    return await this.mailQueue.add(
      'otp',
      { email, code },
      {
        attempts: 2,
        removeOnComplete: true,
      },
    )
  }
}
