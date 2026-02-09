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

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderNotificationEmailProps {
  orderId: string
  customerName: string
  items: OrderItem[]
  total: number
  status: string
  orderUrl: string
}

const logoUrl =
  'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770633723/restaurant-app/avatar/yihgebwzfz3olvsezvpb.png'

const getStatusColor = (status: string) => {
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    'Chờ xác nhận': { bg: '#fff3cd', text: '#856404' },
    'Đã xác nhận': { bg: '#d1ecf1', text: '#0c5460' },
    'Đang chuẩn bị': { bg: '#d1ecf1', text: '#0c5460' },
    'Sẵn sàng': { bg: '#d4edda', text: '#155724' },
    'Đang giao hàng': { bg: '#cce5ff', text: '#004085' },
    'Hoàn thành': { bg: '#d4edda', text: '#155724' },
    'Đã hủy': { bg: '#f8d7da', text: '#721c24' },
  }
  return statusColorMap[status] || { bg: '#e2e3e5', text: '#383d41' }
}

export const OrderNotificationEmail = ({
  orderId,
  customerName,
  items,
  total,
  status,
  orderUrl,
}: OrderNotificationEmailProps) => {
  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(total)

  return (
    <Html>
      <Head />
      <Preview>Cập nhật trạng thái đơn hàng #{orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="80" height="80" alt="Bamixo Logo" style={logoImage} />
          </Section>
          <Heading style={h1}>Cập nhật đơn hàng</Heading>
          <Text style={text}>Chào {customerName},</Text>
          <Text style={text}>
            Đơn hàng <strong>#{orderId}</strong> của bạn đã được cập nhật sang trạng thái:{' '}
            <span
              style={{
                ...statusBadge,
                backgroundColor: getStatusColor(status).bg,
                color: getStatusColor(status).text,
              }}
            >
              {status}
            </span>
          </Text>

          <Section style={orderSummary}>
            <Text style={summaryTitle}>Chi tiết đơn hàng:</Text>
            {items.map((item, index) => (
              <Section key={index} style={itemRow}>
                <table width="100%" style={{ borderSpacing: 0 }}>
                  <tr>
                    <td style={itemName}>
                      {item.quantity}x {item.name}
                    </td>
                    <td style={itemPrice}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.price)}
                    </td>
                  </tr>
                </table>
              </Section>
            ))}
            <Hr style={divider} />
            <Section style={totalRow}>
              <table width="100%" style={{ borderSpacing: 0 }}>
                <tr>
                  <td style={totalLabel}>Tổng cộng:</td>
                  <td style={totalPrice}>{formattedTotal}</td>
                </tr>
              </table>
            </Section>
          </Section>

          <Section style={ctaSection}>
            <Link href={orderUrl} style={button}>
              Xem chi tiết đơn hàng
            </Link>
          </Section>

          <Text style={footer}>
            Nếu bạn có thắc mắc, vui lòng liên hệ hotline 1900 xxxx. <br />
            Email này được gửi tự động, vui lòng không trả lời.
            <br />
            &copy; {new Date().getFullYear()} Bamixo Restaurant. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

OrderNotificationEmail.PreviewProps = {
  orderId: 'ORD-12345',
  customerName: 'Nguyễn Văn A',
  items: [
    { name: 'Bánh mì pate', quantity: 2, price: 50000 },
    { name: 'Trà Đá', quantity: 1, price: 5000 },
  ],
  total: 105000,
  status: 'ĐANG GIAO HÀNG',
  orderUrl: 'https://bamixo.com/orders/ord-12345',
} as OrderNotificationEmailProps

export default OrderNotificationEmail

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

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
  textAlign: 'center' as const,
  margin: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 30px',
  marginBottom: '10px',
}

const statusBadge = {
  fontWeight: 'bold',
  padding: '4px 12px',
  borderRadius: '4px',
  textTransform: 'uppercase' as const,
  fontSize: '12px',
  display: 'inline-block',
}

const orderSummary = {
  margin: '20px 30px',
  padding: '15px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
}

const summaryTitle = {
  fontWeight: 'bold',
  fontSize: '16px',
  marginBottom: '10px',
}

const itemRow = {
  marginBottom: '8px',
}

const itemName = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
  padding: '0',
  textAlign: 'left' as const,
  wordBreak: 'break-word' as const,
  maxWidth: '70%',
}

const itemPrice = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
  padding: '0',
  textAlign: 'right' as const,
  fontWeight: 'bold' as const,
  whiteSpace: 'nowrap' as const,
}

const divider = {
  margin: '10px 0',
  borderColor: '#eee',
}

const totalRow = {
  marginTop: '10px',
}

const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#333',
  margin: '0',
  padding: '0',
  textAlign: 'left' as const,
}

const totalPrice = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#0a85ea',
  margin: '0',
  padding: '0',
  textAlign: 'right' as const,
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
