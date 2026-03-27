import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'
import fs from 'fs'
import path from 'path'
import { OrderNotificationEmail } from 'emails/order-notification'
import { OTPEmail } from 'emails/otp'
import { PromotionEmail } from 'emails/promotion'
import { LowStockEmail } from 'emails/low-stock'
import crypto from 'crypto'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã xác thực OTP của bạn'
    const otpTemplate = fs.readFileSync(
      path.resolve('src/shared/email-templates/otp.html'),
      // path.resolve('apps/api/src/shared/email-templates/otp.html'),
      'utf-8',
    )
    const logo = 'http://localhost:3000/images/logo.png'
    otpTemplate.replace('{{code}}', payload.code).replace('{{logo}}', logo)
    return this.resend.emails.send({
      from: 'Grizz <no-reply@vuonghongky.id.vn>',
      to: [payload.email],
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />,
    })
  }

  sendNotification(to: string, subject: string, content: string) {
    return this.resend.emails.send({
      from: 'Grizz <no-reply@vuonghongky.id.vn>',
      to: [to],
      subject,
      html: `<p>${content}</p>`,
    })
  }

  sendOrderNotification(
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
    const subject = `Cập nhật đơn hàng #${payload.orderId}`
    return this.resend.emails.send({
      from: 'Grizz <no-reply@vuonghongky.id.vn>',
      to: [to],
      subject,
      react: (
        <OrderNotificationEmail
          orderId={payload.orderId}
          customerName={payload.customerName}
          items={payload.items}
          total={payload.total}
          status={payload.status}
          orderUrl={payload.orderUrl}
        />
      ),
    })
  }

  sendPromotionNotification(
    to: string,
    payload: {
      code: string
      description: string
      validFrom: Date
      validTo: Date
      minOrderValue?: number
      discount: string
      unsubscribeToken?: string
    },
  ) {
    const subject = `Mã khuyến mãi mới: ${payload.code}`
    return this.resend.emails.send({
      from: 'Grizz <no-reply@vuonghongky.id.vn>',
      to: [to],
      subject,
      react: (
        <PromotionEmail
          code={payload.code}
          description={payload.description}
          validFrom={payload.validFrom}
          validTo={payload.validTo}
          minOrderValue={payload.minOrderValue}
          discount={payload.discount}
          frontendUrl={envConfig.FRONTEND_URL}
          unsubscribeToken={payload.unsubscribeToken}
        />
      ),
    })
  }

  sendLowStockAlert(
    to: string,
    payload: {
      itemName: string
      currentStock: number
      threshold: number
      unit: string
      inventoryUrl: string
    },
  ) {
    const subject = `⚠️ Cảnh báo tồn kho: ${payload.itemName}`
    return this.resend.emails.send({
      from: 'Grizz <no-reply@vuonghongky.id.vn>',
      to: [to],
      subject,
      react: (
        <LowStockEmail
          itemName={payload.itemName}
          currentStock={payload.currentStock}
          threshold={payload.threshold}
          unit={payload.unit}
          inventoryUrl={payload.inventoryUrl}
        />
      ),
    })
  }
}
