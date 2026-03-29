'use client';

import { useState } from 'react';
import {
    Loader2,
    Plus,
    Home,
    Briefcase,
    MapPin,
    MoreVertical,
    Edit,
    Trash,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AddressType } from '@repo/schema';

import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { Badge } from '@/shared/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

import { trpc } from '@/lib/trpc/client';
import { AddressForm } from './address-form';

export function AddressList() {
    const { data: addresses, isLoading } = trpc.address.list.useQuery({
        page: 1,
        limit: 100,
    });
    const utils = trpc.useUtils();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressType | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const deleteMutation = trpc.address.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa địa chỉ');
            utils.address.list.invalidate();
            setDeletingId(null);
        },
        onError: (error) => {
            toast.error(error.message || 'Xóa địa chỉ thất bại');
        },
    });

    const setDefaultMutation = trpc.address.setDefault.useMutation({
        onSuccess: () => {
            toast.success('Đã đặt làm mặc định');
            utils.address.list.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || 'Thao tác thất bại');
        },
    });

    const handleDelete = () => {
        if (deletingId) {
            deleteMutation.mutate({ id: deletingId });
        }
    };

    const handleEdit = (address: AddressType) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingAddress(null);
        setIsFormOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAdd} size="sm" className="gap-1 w-full sm:w-auto">
                    <Plus className="h-4 w-4" /> Thêm địa chỉ
                </Button>
            </div>

            {!addresses || addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card border-dashed">
                    <div className="rounded-full bg-muted/50 p-4 mb-4">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">
                        Chưa có địa chỉ nào
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Thêm địa chỉ giao hàng để đặt món nhanh hơn.
                    </p>
                    <Button onClick={handleAdd}>Thêm địa chỉ ngay</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`border rounded-lg p-4 bg-card relative group ${address.isDefault ? 'border-primary/50 bg-primary/5' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {address.label
                                        .toLowerCase()
                                        .includes('nhà') ? (
                                        <Home className="h-4 w-4 text-primary" />
                                    ) : address.label
                                          .toLowerCase()
                                          .includes('công ty') ||
                                      address.label
                                          .toLowerCase()
                                          .includes('văn phòng') ? (
                                        <Briefcase className="h-4 w-4 text-primary" />
                                    ) : (
                                        <MapPin className="h-4 w-4 text-primary" />
                                    )}
                                    <span className="font-medium">
                                        {address.label}
                                    </span>
                                    {address.isDefault && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border-none"
                                        >
                                            Mặc định
                                        </Badge>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => handleEdit(address)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />{' '}
                                            Sửa
                                        </DropdownMenuItem>
                                        {!address.isDefault && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setDefaultMutation.mutate(
                                                            { id: address.id },
                                                        )
                                                    }
                                                >
                                                    <Check className="mr-2 h-4 w-4" />{' '}
                                                    Đặt làm mặc định
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setDeletingId(
                                                            address.id,
                                                        )
                                                    }
                                                    className="text-red-500 focus:text-red-500"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />{' '}
                                                    Xóa
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium">
                                    {address.recipientName}
                                </p>
                                <p className="text-muted-foreground">
                                    {address.phoneNumber}
                                </p>
                                <p className="text-muted-foreground line-clamp-2">
                                    {address.address}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddressForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                initialData={editingAddress || undefined}
            />

            <AlertDialog
                open={!!deletingId}
                onOpenChange={(open) => !open && setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Bạn có chắc chắn muốn xóa?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Địa chỉ này sẽ bị
                            xóa khỏi sổ địa chỉ của bạn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Xóa địa chỉ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
