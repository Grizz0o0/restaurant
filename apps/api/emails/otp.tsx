import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface OTPEmailProps {
  otpCode: string
  title: string
}

const logoUrl =
  'https://res.cloudinary.com/dr1dzw92r/image/upload/v1770633723/restaurant-app/avatar/yihgebwzfz3olvsezvpb.png'

export const OTPEmail = ({ otpCode, title }: OTPEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={coverSection}>
          <Section style={imageSection}>
            <Img
              src={logoUrl}
              width="80"
              height="80"
              alt="Bamixo Logo"
              style={{ ...logo, borderRadius: '8px' }}
            />
          </Section>
          <Section style={upperSection}>
            <Heading style={h1}>{title}</Heading>
            <Text style={mainText}>
              Chào bạn, cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất việc xác thực, vui lòng nhập mã
              OTP dưới đây vào trang xác thực:
            </Text>
            <Section style={verificationSection}>
              <Text style={verifyCode}>{otpCode}</Text>
              <Text style={validityText}>(Mã này có hiệu lực trong vòng 10 phút)</Text>
            </Section>
          </Section>
          <Hr />
          <Section style={lowerSection}>
            <Text style={cautionText}>
              Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ
              trợ nếu bạn nghi ngờ có sự xâm nhập trái phép.
            </Text>
          </Section>
        </Section>
        <Text style={footerText}>
          Email này được gửi tự động, vui lòng không trả lời. <br />
          &copy; {new Date().getFullYear()} Bamixo Restaurant. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
)

OTPEmail.PreviewProps = {
  otpCode: '144833',
  title: 'Xác thực tài khoản của bạn',
} as OTPEmailProps

export default OTPEmail

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

const coverSection = {
  backgroundColor: '#fff',
}

const imageSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const upperSection = {
  padding: '25px 35px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
  textAlign: 'center' as const,
  margin: '0',
}

const mainText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const verificationSection = {
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const verifyCode = {
  color: '#000',
  fontSize: '36px',
  fontWeight: 'bold',
  letterSpacing: '6px',
  margin: '10px 0',
  padding: '10px',
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  display: 'inline-block',
  fontFamily: 'monospace',
}

const validityText = {
  color: '#666',
  fontSize: '14px',
  marginTop: '5px',
}

const lowerSection = {
  padding: '25px 35px',
}

const cautionText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '10px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '20px',
}
