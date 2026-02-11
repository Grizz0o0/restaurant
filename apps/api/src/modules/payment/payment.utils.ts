import crypto from 'crypto'

export function generateSignature({
  rawSignature,
  secretKey,
}: {
  rawSignature: string
  secretKey: string
}): string {
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')
  return signature
}

export function buildRawSignature(params: Record<string, string | number | boolean>): string {
  const sortedKeys = Object.keys(params).sort()
  return sortedKeys.map((key) => `${key}=${params[key]}`).join('&')
}
