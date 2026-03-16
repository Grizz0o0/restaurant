import { Injectable, OnModuleInit } from '@nestjs/common'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import envConfig from '@/shared/config'

@Injectable()
export class AiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI
  private model: GenerativeModel

  onModuleInit() {
    this.genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  async generateJson<T>(prompt: string): Promise<T> {
    try {
      const result = await this.model.generateContent([
        prompt,
        '\n\nReturn the response in strictly valid JSON format without markdown code blocks.',
      ])
      const response = result.response
      const text = response.text().trim()

      // Basic cleaning in case the model still includes code blocks
      const cleanJson = text
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim()
      return JSON.parse(cleanJson) as T
    } catch (error) {
      console.error('Gemini JSON parsing error:', error)
      throw new Error('Failed to parse AI JSON response')
    }
  }

  getModel() {
    return this.model
  }
}
