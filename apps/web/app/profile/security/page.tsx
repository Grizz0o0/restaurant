'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from '@/components/ui/card'; // We might not need cards inside the layout structure if we use sections
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function SecurityPage() {
    const [setupData, setSetupData] = useState<{
        secret: string;
        uri: string;
    } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');

    // Mutations
    const setupMutation = trpc.auth.setup2FA.useMutation({
        onSuccess: (data) => {
            setSetupData(data);
            toast.info(
                'Mã QR đã được tạo. Vui lòng quét bằng ứng dụng Authenticator.',
            );
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const disableMutation = trpc.auth.disable2FA.useMutation({
        onSuccess: () => {
            toast.success('Đã tắt xác thực 2 bước.');
            setVerificationCode('');
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSetup = () => {
        setupMutation.mutate(undefined);
    };

    const handleDisable = () => {
        if (!verificationCode) return toast.error('Vui lòng nhập mã xác thực.');
        disableMutation.mutate({ totpCode: verificationCode });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Bảo mật</h3>
                <p className="text-sm text-muted-foreground">
                    Quản lý bảo mật tài khoản và xác thực 2 bước.
                </p>
            </div>
            <Separator />

            <div className="space-y-4">
                <h4 className="text-sm font-medium">Xác thực 2 bước (2FA)</h4>
                <p className="text-sm text-muted-foreground">
                    Tăng cường bảo mật cho tài khoản của bạn bằng cách yêu cầu
                    mã xác thực khi đăng nhập.
                </p>

                {!setupData ? (
                    <div className="flex flex-col gap-4">
                        <Button
                            onClick={handleSetup}
                            disabled={setupMutation.isPending}
                            className="w-full sm:w-fit"
                        >
                            {setupMutation.isPending
                                ? 'Đang tạo...'
                                : 'Thiết lập 2FA'}
                        </Button>

                        <div className="border rounded-lg p-4 bg-muted/50">
                            <h5 className="text-sm font-medium mb-2">
                                Tắt 2FA
                            </h5>
                            <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-sm">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="code" className="text-xs">
                                        Mã Authenticator
                                    </Label>
                                    <Input
                                        type="text"
                                        id="code"
                                        placeholder="123456"
                                        value={verificationCode}
                                        maxLength={6}
                                        onChange={(e) =>
                                            setVerificationCode(e.target.value)
                                        }
                                        className="bg-background"
                                    />
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleDisable}
                                    disabled={disableMutation.isPending}
                                    className="w-full sm:w-fit"
                                >
                                    {disableMutation.isPending
                                        ? 'Đang tắt...'
                                        : 'Tắt 2FA'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-6 border p-6 rounded-lg">
                        <div className="p-4 bg-white rounded-lg border">
                            <QRCodeSVG value={setupData.uri} size={180} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                1. Quét mã QR bằng Google Authenticator hoặc
                                Authy
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Nếu không thể quét, hãy nhập thủ công mã bí mật
                                sau:
                            </p>
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                                {setupData.secret}
                            </code>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                2. Xác thực đã hoàn tất (Lưu ý: Hệ thống hiện
                                tại đã lưu mã bí mật, vui lòng đảm bảo bạn đã
                                lưu vào ứng dụng Authenticator trước khi rời đi)
                            </p>
                            <Button
                                onClick={() => setSetupData(null)}
                                variant="outline"
                            >
                                Hoàn tất
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
