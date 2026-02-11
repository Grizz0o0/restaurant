import { Body, Controller, Post, Res } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { Response } from 'express'

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('momo/ipn')
  async momoIpn(@Body() body: any, @Res() res: Response) {
    await this.paymentService.handleMomoCallback(body)
    return res.status(204).send()
  }
}
