'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Loader2, Upload, User } from 'lucide-react';
import { uploadService } from '@/shared/services/upload.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    disabled?: boolean;
}

export function AvatarUpload({
    value,
    onChange,
    className,
    disabled,
}: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState(value);

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

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsUploading(true);

        try {
            const res = await uploadService.upload(file, 'avatar');
            if (res?.url) {
                onChange(res.url);
                toast.success('Tải ảnh thành công');
            } else {
                throw new Error('Không nhận được đường dẫn ảnh');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Tải ảnh thất bại');
            setPreview(value); // Revert on error
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setIsUploading(false);
            URL.revokeObjectURL(objectUrl);
        }
    };

    return (
        <div className={cn('flex flex-col items-center gap-4', className)}>
            <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-muted">
                    <AvatarImage
                        src={preview || value}
                        className="object-cover"
                    />
                    <AvatarFallback className="bg-muted">
                        <User className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() =>
                        !disabled &&
                        !isUploading &&
                        fileInputRef.current?.click()
                    }
                >
                    {isUploading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                        <Upload className="h-6 w-6 text-white" />
                    )}
                </div>
            </div>

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
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
            >
                {isUploading ? 'Đang tải...' : 'Thay đổi ảnh'}
            </Button>
        </div>
    );
}
