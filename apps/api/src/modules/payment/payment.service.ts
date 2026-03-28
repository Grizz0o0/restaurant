import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import envConfig from '@/shared/config'
import { generateSignature, buildRawSignature } from './payment.utils'
import { GetTransactionsQueryType } from '@repo/schema'

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createMomoPayment(orderId: string, amount: number, orderInfo: string) {
    const {
      MOMO_PARTNER_CODE: partnerCode,
      MOMO_ACCESS_KEY: accessKey,
      MOMO_SECRET_KEY: secretKey,
      MOMO_IPN_URL: ipnUrl,
      MOMO_REDIRECT_URL: redirectUrl,
      MOMO_ENDPOINT: endpoint,
    } = envConfig

    const requestId = `${partnerCode}${new Date().getTime()}`
    const momoOrderId = requestId
    const requestType = 'payWithMethod'
    const extraData = ''
    const autoCapture = true
    const lang = 'vi'

    const rawSignature = buildRawSignature({
      accessKey,
      amount,
      extraData,
      ipnUrl,
      orderId: momoOrderId,
      orderInfo,
      partnerCode,
      redirectUrl,
      requestId,
      requestType,
    })

    const signature = generateSignature({ rawSignature, secretKey })

    const requestBody = {
      partnerCode,
      partnerName: 'Restaurant App',
      storeId: 'MomoTestStore',
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      extraData,
      signature,
      autoCapture,
    }

    try {
      // Create PaymentTransaction
      await this.prisma.paymentTransaction.create({
        data: {
          gateway: 'MOMO',
          amountIn: amount,
          orderId: orderId,
          transactionContent: `Momo Order: ${momoOrderId}`,
          referenceNumber: momoOrderId,
          body: JSON.stringify(requestBody),
        },
      })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.resultCode !== 0) {
        throw new BadRequestException(`MoMo Error: ${data.message}`)
      }

      return data
    } catch (error) {
      this.logger.error('MoMo Init Error', error)
      throw new BadRequestException('Failed to initiate MoMo payment')
    }
  }

  async handleMomoCallback(body: any) {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body

    const { MOMO_SECRET_KEY: secretKey, MOMO_ACCESS_KEY: accessKey } = envConfig

    const rawSignature = buildRawSignature({
      accessKey,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId,
    })

    const generatedSignature = generateSignature({ rawSignature, secretKey })

    if (generatedSignature !== signature) {
      this.logger.error(`Invalid Signature: exp ${generatedSignature} != rec ${signature}`)
      throw new BadRequestException('Invalid signature')
    }

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { referenceNumber: orderId },
      include: { order: true },
    })

    if (!transaction) {
      this.logger.error(`Transaction not found for orderId: ${orderId}`)
      throw new NotFoundException('Transaction not found')
    }

    if (resultCode === 0) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          amountOut: 0,
          accumulated: amount,
          code: transId.toString(),
          body: JSON.stringify(body),
        },
      })

      // Update Order
      if (transaction.order) {
        await this.prisma.order.update({
          where: { id: transaction.orderId! },
          data: {
            status:
              transaction.order.status === 'PENDING_CONFIRMATION'
                ? 'PREPARING'
                : transaction.order.status,
            paymentStatus: 'PAID',
          },
        })
      }
    }
  }

  async initiatePayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    if (order.status === 'CANCELLED' || order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order cannot be paid')
    }

    // Call MoMo
    const momoResponse = await this.createMomoPayment(
      order.id,
      Number(order.totalAmount),
      `Thanh toan don hang ${order.id}`,
    )

    return {
      payUrl: momoResponse.payUrl,
      deeplink: momoResponse.deeplink,
    }
  }

  async checkTransactionStatus(orderId: string) {
    const {
      MOMO_PARTNER_CODE: partnerCode,
      MOMO_ACCESS_KEY: accessKey,
      MOMO_SECRET_KEY: secretKey,
      MOMO_ENDPOINT: endpoint,
    } = envConfig

    const queryEndpoint = endpoint.replace('/create', '/query')

    const requestId = `${partnerCode}${new Date().getTime()}`
    const momoOrderId = orderId

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { orderId: orderId },
      orderBy: { createdAt: 'desc' },
    })

    if (!transaction || !transaction.referenceNumber) {
      throw new NotFoundException('Transaction not found or invalid')
    }

    const rawSignature = buildRawSignature({
      accessKey,
      orderId: transaction.referenceNumber,
      partnerCode,
      requestId,
    })
    const signature = generateSignature({ rawSignature, secretKey })

    const requestBody = {
      partnerCode,
      requestId,
      orderId: transaction.referenceNumber,
      signature,
      lang: 'vi',
    }

    try {
      const response = await fetch(queryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.resultCode === 0) {
        if (transaction.orderId) {
          await this.prisma.order.update({
            where: { id: transaction.orderId },
            data: { paymentStatus: 'PAID', status: 'PREPARING' },
          })
        }
        await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            body: JSON.stringify(data),
          },
        })
      }

      return {
        status: data.resultCode === 0 ? 'SUCCESS' : 'FAILED',
        message: data.message,
        resultCode: data.resultCode,
      }
    } catch (error) {
      this.logger.error('MoMo Query Error', error)
      throw new BadRequestException('Failed to query MoMo status')
    }
  }

  async refundTransaction(orderId: string) {
    const {
      MOMO_PARTNER_CODE: partnerCode,
      MOMO_ACCESS_KEY: accessKey,
      MOMO_SECRET_KEY: secretKey,
      MOMO_ENDPOINT: endpoint,
    } = envConfig

    const refundEndpoint = endpoint.replace('/create', '/refund')

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { orderId: orderId, amountOut: 0 },
      orderBy: { createdAt: 'desc' },
    })

    if (!transaction || !transaction.code) {
      throw new NotFoundException('No successful payment transaction found for this order')
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')

    const amount = Number(order.totalAmount)
    const description = `Hoan tien don hang ${orderId}`
    const requestId = `${partnerCode}${new Date().getTime()}`
    const orderIdRefund = `${orderId}_REFUND`
    const transId = Number(transaction.code)

    const rawSignature = buildRawSignature({
      accessKey,
      amount,
      description,
      orderId: orderIdRefund,
      partnerCode,
      requestId,
      transId,
    })
    const signature = generateSignature({ rawSignature, secretKey })

    const requestBody = {
      partnerCode,
      orderId: orderIdRefund,
      requestId,
      amount,
      transId,
      lang: 'vi',
      description,
      signature,
    }

    try {
      const response = await fetch(refundEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.resultCode === 0) {
        // Update Order Status
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'REFUNDED',
            status: 'CANCELLED',
          },
        })

        // Create Refund Transaction Record
        await this.prisma.paymentTransaction.create({
          data: {
            gateway: 'MOMO',
            amountIn: 0,
            amountOut: amount,
            orderId: orderId,
            transactionContent: `Refund for Order: ${orderId}`,
            referenceNumber: orderIdRefund,
            body: JSON.stringify(data),
            code: String(data.transId),
          },
        })
      }

      return {
        status: data.resultCode === 0 ? 'SUCCESS' : 'FAILED',
        message: data.message,
        resultCode: data.resultCode,
        transId: data.transId,
      }
    } catch (error) {
      this.logger.error('MoMo Refund Error', error)
      throw new BadRequestException('Failed to refund transaction')
    }
  }

  async listTransactions(query: GetTransactionsQueryType) {
    const { page, limit, gateway, orderId } = query
    const skip = (page - 1) * limit

    const where: any = {}
    if (gateway) where.gateway = gateway
    if (orderId) where.orderId = orderId

    const [items, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentTransaction.count({ where }),
    ])

    return { items, total }
  }
}
