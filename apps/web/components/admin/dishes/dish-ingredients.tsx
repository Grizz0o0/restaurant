import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DishIngredientsProps {
    dishId: string;
}

export function DishIngredients({ dishId }: DishIngredientsProps) {
    const utils = trpc.useUtils();
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
    const [quantityStr, setQuantityStr] = useState<string>('');

    // Fetch all ingredients for this dish
    const { data: ingredientsData, isLoading: isLoadingIngredients } =
        trpc.inventoryDish.getDishIngredients.useQuery({ dishId });

    // Fetch all available inventory options via TRPC
    const { data: inventoryData, isLoading: isLoadingInventory } =
        trpc.inventory.list.useQuery({ page: 1, limit: 1000 });
    const inventoryItems: any[] = inventoryData?.data ?? [];


    const ingredients = ingredientsData?.data || [];

    // Mutations
    const addMutation = trpc.inventoryDish.addIngredientToDish.useMutation({
        onSuccess: () => {
            toast.success('Đã thêm nguyên liệu');
            utils.inventoryDish.getDishIngredients.invalidate({ dishId });
            setSelectedInventoryId('');
            setQuantityStr('');
        },
        onError: (err) => {
            toast.error(`Lỗi thêm nguyên liệu: ${err.message}`);
        },
    });

    const updateMutation =
        trpc.inventoryDish.updateIngredientQuantity.useMutation({
            onSuccess: () => {
                toast.success('Đã cập nhật số lượng');
                utils.inventoryDish.getDishIngredients.invalidate({ dishId });
            },
            onError: (err) => {
                toast.error(`Lỗi cập nhật: ${err.message}`);
            },
        });

    const removeMutation =
        trpc.inventoryDish.removeIngredientFromDish.useMutation({
            onSuccess: () => {
                toast.success('Đã xóa nguyên liệu');
                utils.inventoryDish.getDishIngredients.invalidate({ dishId });
            },
            onError: (err) => {
                toast.error(`Lỗi xóa: ${err.message}`);
            },
        });

    const handleAdd = () => {
        const quantity = parseFloat(quantityStr);
        if (!selectedInventoryId) {
            toast.error('Vui lòng chọn nguyên liệu');
            return;
        }
        if (isNaN(quantity) || quantity <= 0) {
            toast.error('Số lượng không hợp lệ');
            return;
        }

        addMutation.mutate({
            dishId,
            inventoryId: selectedInventoryId,
            quantityUsed: quantity,
        });
    };

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingQty, setEditingQty] = useState<string>('');

    const handleStartEdit = (inventoryId: string, currentQty: number) => {
        setEditingId(inventoryId);
        setEditingQty(currentQty.toString());
    };

    const handleSaveEdit = (inventoryId: string) => {
        const quantity = parseFloat(editingQty);
        if (isNaN(quantity) || quantity <= 0) {
            toast.error('Số lượng không hợp lệ');
            return;
        }

        updateMutation.mutate({
            dishId,
            inventoryId,
            data: {
                quantityUsed: quantity,
            },
        });
        setEditingId(null);
    };

    const handleRemove = (inventoryId: string) => {
        if (
            window.confirm(
                'Bạn có chắc muốn xóa nguyên liệu này khỏi công thức?',
            )
        ) {
            removeMutation.mutate({ dishId, inventoryId });
        }
    };

    // Filter out inventory items that are already added
    const availableInventoryItems = inventoryItems.filter(
        (item) => !ingredients.some((i: any) => i.inventoryId === item.id),
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Công thức / Nguyên liệu
                </h3>
            </div>

            <div className="flex gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Nguyên liệu</label>
                    <Select
                        value={selectedInventoryId}
                        onValueChange={setSelectedInventoryId}
                        disabled={isLoadingInventory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn nguyên liệu..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableInventoryItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.itemName} ({item.unit})
                                </SelectItem>
                            ))}
                            {availableInventoryItems.length === 0 && (
                                <SelectItem value="empty" disabled>
                                    Không còn nguyên liệu nào để thêm
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-32 space-y-2">
                    <label className="text-sm font-medium">Định mức</label>
                    <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="Số lượng"
                        value={quantityStr}
                        onChange={(e) => setQuantityStr(e.target.value)}
                    />
                </div>
                <Button
                    onClick={handleAdd}
                    disabled={
                        addMutation.isPending ||
                        !selectedInventoryId ||
                        !quantityStr
                    }
                    className="bg-primary hover:bg-primary/90"
                >
                    {addMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Plus className="w-4 h-4 mr-2" /> Thêm
                        </>
                    )}
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên nguyên liệu</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead>Định mức</TableHead>
                            <TableHead className="w-25 text-right">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingIngredients ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center"
                                >
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : ingredients.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Chưa có nguyên liệu nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            ingredients.map((item: any) => (
                                <TableRow key={item.inventoryId}>
                                    <TableCell className="font-medium">
                                        {item.inventory?.itemName || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {item.inventory?.unit || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === item.inventoryId ? (
                                            <Input
                                                type="number"
                                                className="w-24 h-8"
                                                autoFocus
                                                value={editingQty}
                                                onChange={(e) =>
                                                    setEditingQty(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter')
                                                        handleSaveEdit(
                                                            item.inventoryId,
                                                        );
                                                    if (e.key === 'Escape')
                                                        setEditingId(null);
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="cursor-pointer hover:text-primary transition-colors py-1"
                                                onClick={() =>
                                                    handleStartEdit(
                                                        item.inventoryId,
                                                        item.quantityUsed,
                                                    )
                                                }
                                                title="Click để sửa"
                                            >
                                                {item.quantityUsed}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === item.inventoryId ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() =>
                                                    handleSaveEdit(
                                                        item.inventoryId,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending
                                                }
                                            >
                                                <Save className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleRemove(
                                                        item.inventoryId,
                                                    )
                                                }
                                                disabled={
                                                    removeMutation.isPending
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
