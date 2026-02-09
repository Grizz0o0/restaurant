import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface PromotionEmailProps {
  code: string
  description: string
  validFrom: Date
  validTo: Date
  minOrderValue?: number
  discount: string
  frontendUrl: string
  unsubscribeToken?: string
}

const logoUrl =
  'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770633723/restaurant-app/avatar/yihgebwzfz3olvsezvpb.png'

export const PromotionEmail = ({
  code,
  description,
  validFrom,
  validTo,
  minOrderValue,
  discount,
  frontendUrl,
  unsubscribeToken,
}: PromotionEmailProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  return (
    <Html>
      <Head />
      <Preview>Mã khuyến mãi mới: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="80" height="80" alt="Bamixo Logo" style={logoImage} />
          </Section>

          <Section style={promotionBanner}>
            <Text style={bannerText}>🎉 KHUYẾN MÃI ĐẶC BIỆT 🎉</Text>
          </Section>

          <Heading style={h1}>Mã giảm giá dành cho bạn!</Heading>

          <Text style={text}>Chào bạn, chúng tôi có một ưu đãi đặc biệt dành riêng cho bạn!</Text>

          <Section style={promoCodeSection}>
            <Text style={promoLabel}>MÃ GIẢM GIÁ</Text>
            <Text style={promoCode}>{code}</Text>
            <Text style={discountText}>{discount}</Text>
          </Section>

          <Section style={detailsSection}>
            <Text style={descriptionText}>{description}</Text>

            {minOrderValue && (
              <Text style={conditionText}>
                💰 Áp dụng cho đơn hàng từ{' '}
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(minOrderValue)}
              </Text>
            )}

            <Hr style={divider} />

            <Section style={validitySection}>
              <Text style={validityLabel}>Thời gian áp dụng:</Text>
              <Text style={validityText}>
                📅 Từ {formatDate(validFrom)} đến {formatDate(validTo)}
              </Text>
            </Section>
          </Section>

          <Section style={ctaSection}>
            <Link href={`${frontendUrl}/menu`} style={button}>
              Đặt hàng ngay
            </Link>
          </Section>

          <Text style={footer}>
            Nhanh tay đặt hàng để không bỏ lỡ ưu đãi này! <br />
            Email này được gửi tự động, vui lòng không trả lời.
            <br />
            &copy; {new Date().getFullYear()} Bamixo Restaurant. All rights reserved.
          </Text>

          {unsubscribeToken && (
            <Text style={unsubscribeText}>
              Không muốn nhận email khuyến mãi?{' '}
              <Link
                href={`${frontendUrl}/unsubscribe?token=${unsubscribeToken}`}
                style={unsubscribeLink}
              >
                Hủy đăng ký
              </Link>
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

PromotionEmail.PreviewProps = {
  code: 'WELCOME2024',
  description: 'Giảm giá 20% cho tất cả các món ăn',
  validFrom: new Date('2024-01-01'),
  validTo: new Date('2024-12-31'),
  minOrderValue: 100000,
  discount: 'Giảm 20%',
  frontendUrl: 'http://localhost:3000',
} as PromotionEmailProps

export default PromotionEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '30px 0 20px',
  textAlign: 'center' as const,
}

const logoImage = {
  borderRadius: '8px',
  display: 'block',
  margin: '0 auto',
}

const promotionBanner = {
  backgroundColor: '#ff6b35',
  padding: '15px',
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const bannerText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '1px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '0 30px',
  marginBottom: '20px',
}

const promoCodeSection = {
  backgroundColor: '#f4f4f4',
  border: '2px dashed #0a85ea',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 30px',
  textAlign: 'center' as const,
}

const promoLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
  letterSpacing: '1px',
}

const promoCode = {
  color: '#0a85ea',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  margin: '10px 0',
  fontFamily: 'monospace',
}

const discountText = {
  color: '#ff6b35',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '10px 0 0 0',
}

const detailsSection = {
  padding: '0 30px',
  marginTop: '20px',
}

const descriptionText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  marginBottom: '15px',
}

const conditionText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  marginBottom: '15px',
  backgroundColor: '#fff9e6',
  padding: '10px',
  borderRadius: '5px',
}

const divider = {
  margin: '20px 0',
  borderColor: '#eee',
}

const validitySection = {
  textAlign: 'center' as const,
  marginTop: '15px',
}

const validityLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 5px 0',
}

const validityText = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '30px',
  marginBottom: '30px',
}

const button = {
  backgroundColor: '#ff6b35',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '100%',
  maxWidth: '200px',
  padding: '12px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '40px',
  padding: '0 30px',
}

const unsubscribeText = {
  color: '#8898aa',
  fontSize: '11px',
  textAlign: 'center' as const,
  marginTop: '15px',
  padding: '0 30px',
}

const unsubscribeLink = {
  color: '#0a85ea',
  textDecoration: 'underline',
}
