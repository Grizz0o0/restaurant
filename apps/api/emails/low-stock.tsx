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

interface LowStockEmailProps {
  itemName: string
  currentStock: number
  threshold: number
  unit: string
  inventoryUrl: string
}

const logoUrl =
  'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770633723/restaurant-app/avatar/yihgebwzfz3olvsezvpb.png'

export const LowStockEmail = ({
  itemName,
  currentStock,
  threshold,
  unit,
  inventoryUrl,
}: LowStockEmailProps) => {
  const stockPercentage = Math.round((currentStock / threshold) * 100)
  const isUrgent = stockPercentage <= 50

  return (
    <Html>
      <Head />
      <Preview>⚠️ Cảnh báo tồn kho thấp: {itemName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="80" height="80" alt="Bamixo Logo" style={logoImage} />
          </Section>

          <Section style={alertBanner}>
            <Text style={alertIcon}>⚠️</Text>
            <Text style={bannerText}>CẢNH BÁO TỒN KHO</Text>
          </Section>

          <Heading style={h1}>Tồn kho sắp hết</Heading>

          <Text style={text}>
            Nguyên liệu <strong>{itemName}</strong> đang ở mức tồn kho thấp và cần được bổ sung.
          </Text>

          <Section style={stockInfoSection}>
            <Section style={stockRow}>
              <Text style={stockLabel}>Nguyên liệu:</Text>
              <Text style={stockValue}>{itemName}</Text>
            </Section>

            <Section style={stockRow}>
              <Text style={stockLabel}>Tồn kho hiện tại:</Text>
              <Text style={{ ...stockValue, color: isUrgent ? '#dc3545' : '#ff6b35' }}>
                {currentStock} {unit}
              </Text>
            </Section>

            <Section style={stockRow}>
              <Text style={stockLabel}>Ngưỡng cảnh báo:</Text>
              <Text style={stockValue}>
                {threshold} {unit}
              </Text>
            </Section>

            <Hr style={divider} />

            <Section style={percentageSection}>
              <Text style={percentageLabel}>Mức tồn kho:</Text>
              <Section style={progressBarContainer}>
                <Section
                  style={{
                    ...progressBar,
                    width: `${Math.min(stockPercentage, 100)}%`,
                    backgroundColor: isUrgent ? '#dc3545' : '#ff6b35',
                  }}
                />
              </Section>
              <Text style={percentageText}>{stockPercentage}% ngưỡng</Text>
            </Section>
          </Section>

          {isUrgent && (
            <Section style={urgentNotice}>
              <Text style={urgentText}>
                🚨 <strong>KHẨN CẤP:</strong> Tồn kho dưới 50% ngưỡng cảnh báo. Vui lòng đặt hàng
                ngay!
              </Text>
            </Section>
          )}

          <Section style={ctaSection}>
            <Link href={inventoryUrl} style={button}>
              Quản lý tồn kho
            </Link>
          </Section>

          <Text style={footer}>
            Email này được gửi tự động từ hệ thống quản lý tồn kho. <br />
            Vui lòng kiểm tra và bổ sung nguyên liệu kịp thời.
            <br />
            &copy; {new Date().getFullYear()} Bamixo Restaurant. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

LowStockEmail.PreviewProps = {
  itemName: 'Thịt bò',
  currentStock: 15,
  threshold: 50,
  unit: 'kg',
  inventoryUrl: 'https://bamixo.com/admin/inventory',
} as LowStockEmailProps

export default LowStockEmail

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

const alertBanner = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ff6b35',
  padding: '15px',
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const alertIcon = {
  fontSize: '32px',
  margin: '0 0 5px 0',
}

const bannerText = {
  color: '#856404',
  fontSize: '16px',
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

const stockInfoSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 30px',
}

const stockRow = {
  marginBottom: '15px',
}

const stockLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 5px 0',
  fontWeight: 'bold',
}

const stockValue = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
}

const divider = {
  margin: '20px 0',
  borderColor: '#dee2e6',
}

const percentageSection = {
  textAlign: 'center' as const,
  marginTop: '15px',
}

const percentageLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const progressBarContainer = {
  width: '100%',
  height: '20px',
  backgroundColor: '#e9ecef',
  borderRadius: '10px',
  overflow: 'hidden',
  margin: '10px 0',
}

const progressBar = {
  height: '100%',
  transition: 'width 0.3s ease',
  borderRadius: '10px',
}

const percentageText = {
  color: '#333',
  fontSize: '14px',
  margin: '5px 0 0 0',
}

const urgentNotice = {
  backgroundColor: '#f8d7da',
  border: '1px solid #dc3545',
  borderRadius: '5px',
  padding: '15px',
  margin: '20px 30px',
}

const urgentText = {
  color: '#721c24',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
}

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '30px',
  marginBottom: '30px',
}

const button = {
  backgroundColor: '#0a85ea',
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
