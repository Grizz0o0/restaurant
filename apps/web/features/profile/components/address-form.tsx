'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAddressBodySchema, CreateAddressBodyType, AddressType } from '@repo/schema';
import { toast } from 'sonner';
import { useEffect } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/shared/ui/form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { trpc } from '@/lib/trpc/client';

interface AddressFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: AddressType;
    onSuccess?: () => void;
}

export function AddressForm({
    open,
    onOpenChange,
    initialData,
    onSuccess,
}: AddressFormProps) {
    const utils = trpc.useUtils();
    const isEditing = !!initialData;

    const form = useForm<CreateAddressBodyType>({
        resolver: zodResolver(
            CreateAddressBodySchema,
        ) as Resolver<CreateAddressBodyType>,
        defaultValues: {
            label: '',
            recipientName: '',
            phoneNumber: '',
            address: '',
            isDefault: false,
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                label: initialData.label,
                recipientName: initialData.recipientName,
                phoneNumber: initialData.phoneNumber,
                address: initialData.address,
                isDefault: initialData.isDefault,
            });
        } else {
            form.reset({
                label: '',
                recipientName: '',
                phoneNumber: '',
                address: '',
                isDefault: false,
            });
        }
    }, [initialData, form, open]);

    const createMutation = trpc.address.create.useMutation({
        onSuccess: () => {
            toast.success('Đã thêm địa chỉ mới');
            utils.address.list.invalidate();
            onOpenChange(false);
            onSuccess?.();
            form.reset();
        },
        onError: (error) => {
            toast.error(error.message || 'Thêm địa chỉ thất bại');
        },
    });

    const updateMutation = trpc.address.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật địa chỉ');
            utils.address.list.invalidate();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || 'Cập nhật địa chỉ thất bại');
        },
    });

    const onSubmit = (values: CreateAddressBodyType) => {
        if (isEditing) {
            updateMutation.mutate({
                id: initialData.id,
                ...values,
            });
        } else {
            createMutation.mutate(values);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-125">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên gợi nhớ</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ví dụ: Nhà riêng, Công ty"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="recipientName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Người nhận</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Tên người nhận"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Số điện thoại"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Địa chỉ chi tiết</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Số nhà, tên đường, phường/xã..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isDefault"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Đặt làm địa chỉ mặc định
                                        </FormLabel>
                                        <FormDescription>
                                            Địa chỉ này sẽ được chọn tự động khi
                                            thanh toán.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? 'Đang lưu...'
                                    : isEditing
                                      ? 'Cập nhật'
                                      : 'Thêm mới'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
