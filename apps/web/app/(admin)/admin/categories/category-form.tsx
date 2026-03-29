'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { CreateCategoryBodySchema, type LanguageType } from '@repo/schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useEffect } from 'react';

export type CategoryFormValues = z.infer<typeof CreateCategoryBodySchema>;

interface CategoryFormProps {
    defaultValues?: CategoryFormValues;
    onSubmit: (values: CategoryFormValues) => void;
    isLoading: boolean;
    submitText: string;
    onCancel: () => void;
    languages: LanguageType[];
}

export function CategoryForm({
    defaultValues,
    onSubmit,
    isLoading,
    submitText,
    onCancel,
    languages,
}: CategoryFormProps) {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(CreateCategoryBodySchema),
        defaultValues: defaultValues || {
            name: '',
            description: '',
            languageId: 'vi',
        },
    });

    // Reset form when defaultValues change
    useEffect(() => {
        if (defaultValues) {
            form.reset(defaultValues);
        }
    }, [defaultValues, form]);

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 pt-4"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên danh mục</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ví dụ: Món chính, Món tráng miệng..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={3}
                                    placeholder="Mô tả ngắn về danh mục này..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 gap-4">
                    <FormField
                        control={form.control}
                        name="languageId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ngôn ngữ</FormLabel>
                                <Select
                                    value={field.value || 'vi'}
                                    onValueChange={field.onChange}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn ngôn ngữ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {languages.map((l: LanguageType) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            submitText
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
