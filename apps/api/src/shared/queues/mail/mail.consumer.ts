import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { EmailService } from '@/shared/services/email.service'

@Processor('mail')
export class MailConsumer extends WorkerHost {
  private readonly logger = new Logger(MailConsumer.name)

  constructor(private readonly emailService: EmailService) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[BullMQ Worker] Processing job ${job.id} (type: ${job.name})...`)

    try {
      switch (job.name) {
        case 'notification': {
          const { to, subject, content } = job.data
          const res = await this.emailService.sendNotification(to, subject, content)
          this.logger.log(`[BullMQ Worker] Notification email sent to ${to}`)
          return res
        }
        case 'order-notification': {
          const { to, payload } = job.data
          const res = await this.emailService.sendOrderNotification(to, payload)
          this.logger.log(`[BullMQ Worker] Order notification email sent for order #${payload.orderId}`)
          return res
        }
        case 'otp': {
          const { email, code } = job.data
          const res = await this.emailService.sendOTP({ email, code })
          this.logger.log(`[BullMQ Worker] OTP email sent to ${email}`)
          return res
        }
        default:
          this.logger.warn(`[BullMQ Worker] Unknown job name: ${job.name}`)
      }
    } catch (error) {
      this.logger.error(`[BullMQ Worker] Failed job ${job.id}: ${(error as Error).message}`, (error as Error).stack)
      throw error // Re-throw to trigger BullMQ retry backoff
    }
  }
}
