import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { AiService } from '@/shared/services/ai.service'

@Injectable()
export class AiChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async chat(message: string, history: { role: 'user' | 'model'; parts: string[] }[] = []) {
    // 1. Fetch menu data for context
    const dishes = await this.prisma.dish.findMany({
      where: { deletedAt: null },
      include: {
        dishTranslations: {
          where: { languageId: 'vi' },
        },
        categories: {
          include: {
            dishCategoryTranslations: {
              where: { languageId: 'vi' },
            },
          },
        },
      },
    })

    const menuContext = dishes
      .map((dish) => {
        const trans = dish.dishTranslations[0]
        const cats = dish.categories
          .map((c) => c.dishCategoryTranslations[0]?.name)
          .filter(Boolean)
          .join(', ')
        return `- ${trans?.name}: ${trans?.description}. Giá: ${Number(dish.basePrice).toLocaleString('vi-VN')}đ. Danh mục: ${cats}`
      })
      .join('\n')

    // 2. Build system prompt
    const systemPrompt = `Bạn là một trợ lý ảo thông minh của nhà hàng BAMIXO Restaurant. 
      Hãy trả lời khách hàng một cách thân thiện, chuyên nghiệp và nhiệt tình bằng tiếng Việt.

      Thông tin thực đơn của nhà hàng:
      ${menuContext}

      Quy tắc:
      1. Chỉ trả lời dựa trên thông tin thực đơn được cung cấp. Nếu khách hỏi món không có, hãy khéo léo gợi ý món tương tự.
      2. Luôn khuyến khích khách hàng thử các món đặc biệt.
      3. Nếu khách hỏi về dị ứng hoặc chế độ ăn đặc biệt, hãy kiểm tra kỹ mô tả món ăn.
      4. Giữ câu trả lời ngắn gọn, súc tích.

      Lịch sử trò chuyện:
      ${history.map((h) => `${h.role === 'user' ? 'Khách' : 'AI'}: ${h.parts[0]}`).join('\n')}
      Khách: ${message}
    AI:`

    const response = await this.aiService.generateText(systemPrompt)
    return { text: response }
  }
}
