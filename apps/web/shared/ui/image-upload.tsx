'use client';

import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadService } from '@/shared/services/upload.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    disabled?: boolean;
    folder?: string;
}

export function ImageUpload({
    value,
    onChange,
    className,
    disabled,
    folder = 'dishes',
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File quá lớn (Tối đa 5MB)');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }

        setIsUploading(true);

        try {
            const res = await uploadService.upload(file, folder);
            console.log('Upload response:', res);
            if (res?.url) {
                onChange(res.url);
                toast.success('Tải ảnh thành công');
            } else {
                throw new Error('Không nhận được đường dẫn ảnh');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Tải ảnh thất bại');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn('space-y-4 w-full', className)}>
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative aspect-video w-40 rounded-md overflow-hidden border">
                        <Image
                            fill
                            src={value}
                            alt="Upload preview"
                            className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-sm hover:bg-rose-600 transition-colors"
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() =>
                            !disabled && fileInputRef.current?.click()
                        }
                        className={cn(
                            'flex flex-col items-center justify-center w-40 aspect-video rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer',
                            disabled && 'opacity-50 cursor-not-allowed',
                        )}
                    >
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">
                            Tải ảnh lên
                        </span>
                    </div>
                )}

                <div className="flex-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={disabled || isUploading}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tải...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Chọn ảnh
                            </>
                        )}
                    </Button>
                    <p className="text-[0.8rem] text-muted-foreground mt-2">
                        Khuyên dùng: Ảnh tỷ lệ 16:9 hoặc 4:3, tối đa 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
}
