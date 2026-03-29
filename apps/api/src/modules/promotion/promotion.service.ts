import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { CreatePromotionType, UpdatePromotionType, ApplyPromotionType } from '@repo/schema'
import { PromotionType } from 'src/generated/prisma/client'

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionType) {
    const existing = await this.prisma.promotion.findUnique({
      where: { code: createPromotionDto.code },
    })
    if (existing) {
      throw new BadRequestException('Promotion code already exists')
    }

    return this.prisma.promotion.create({
      data: createPromotionDto,
    })
  }

  async findAll() {
    return await this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    })
    if (!promotion) {
      throw new NotFoundException('Promotion not found')
    }
    return promotion
  }

  async update(id: string, updatePromotionDto: UpdatePromotionType) {
    await this.findOne(id)
    return this.prisma.promotion.update({
      where: { id },
      data: updatePromotionDto,
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.promotion.delete({
      where: { id },
    })
  }

  async apply(applyDto: ApplyPromotionType) {
    const { code, orderValue } = applyDto
    const promotion = await this.prisma.promotion.findUnique({
      where: { code },
    })

    if (!promotion) {
      throw new NotFoundException('Invalid promotion code')
    }

    const now = new Date()
    if (now < promotion.validFrom || now > promotion.validTo) {
      throw new BadRequestException('Promotion is expired or not yet valid')
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Promotion usage limit exceeded')
    }

    if (promotion.minOrderValue && orderValue < Number(promotion.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value of ${Number(promotion.minOrderValue)} required`,
      )
    }

    let discountAmount = 0
    if (promotion.type === PromotionType.FIXED) {
      discountAmount = Number(promotion.amount)
    } else if (promotion.type === PromotionType.PERCENTAGE) {
      if (!promotion.percentage) {
        throw new BadRequestException('Percentage value missing for percentage promotion')
      }
      discountAmount = (orderValue * Number(promotion.percentage)) / 100
    }

    // Ensure discount doesn't exceed order value
    if (discountAmount > orderValue) {
      discountAmount = orderValue
    }

    return {
      isValid: true,
      promotionId: promotion.id,
      code: promotion.code,
      discountAmount,
      finalAmount: orderValue - discountAmount,
    }
  }
}
