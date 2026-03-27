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
import { Plus, Trash2, Loader2, Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface DishIngredientsProps {
    dishId: string;
}

export function DishIngredients({ dishId }: DishIngredientsProps) {
    const utils = trpc.useUtils();

    // --- UI State ---
    const [selectedSkuId, setSelectedSkuId] = useState<string>('BASE'); // 'BASE' for Main Recipe
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
    const [quantityStr, setQuantityStr] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingQty, setEditingQty] = useState<string>('');

    // --- Fetches ---
    const { data: dishData } = trpc.dish.detail.useQuery({ id: dishId });
    const skus = dishData?.skus || [];

    const { data: baseIngredientsData, isLoading: isLoadingBase } =
        trpc.inventoryDish.getDishIngredients.useQuery({ dishId });
    const baseIngredients = baseIngredientsData?.data || [];

    const isModeSku = selectedSkuId !== 'BASE';

    const { data: skuIngredientsData, isLoading: isLoadingSku } =
        trpc.inventoryDish.getSkuIngredients.useQuery(
            { skuId: isModeSku ? selectedSkuId : '' },
            { enabled: isModeSku },
        );
    const skuOverrides = skuIngredientsData?.data || [];

    const { data: inventoryData, isLoading: isLoadingInventory } =
        trpc.inventory.list.useQuery({ page: 1, limit: 1000 });
    const inventoryItems: any[] = inventoryData?.data ?? [];

    // --- Compute Display List ---
    let displayList: any[] = [];
    if (!isModeSku) {
        displayList = baseIngredients.map((item: any) => ({
            ...item,
            isOverride: false,
            isSkuOnly: false,
            isBaseInSkuMode: false,
        }));
    } else {
        const merged = new Map();
        for (const base of baseIngredients) {
            merged.set(base.inventoryId, {
                inventoryId: base.inventoryId,
                inventory: base.inventory,
                quantityUsed: base.quantityUsed,
                isBaseInSkuMode: true,
                isOverride: false,
                isSkuOnly: false,
            });
        }

        for (const over of skuOverrides) {
            if (merged.has(over.inventoryId)) {
                const existing = merged.get(over.inventoryId);
                existing.quantityUsed = over.quantityUsed;
                existing.isOverride = true;
                // Note: if quantityUsed is <= 0 it means it's manually excluded
            } else {
                merged.set(over.inventoryId, {
                    inventoryId: over.inventoryId,
                    inventory: over.inventory,
                    quantityUsed: over.quantityUsed,
                    isBaseInSkuMode: false,
                    isOverride: false,
                    isSkuOnly: true,
                });
            }
        }

        // Exclude intentionally deleted materials (qty <= 0)
        displayList = Array.from(merged.values()).filter(
            (i) => i.quantityUsed > 0,
        );
    }

    const isLoading = isModeSku ? isLoadingBase || isLoadingSku : isLoadingBase;

    // --- Mutations Base ---
    const onSuccessBase = () => {
        toast.success('Đã lưu nguyên liệu chung');
        utils.inventoryDish.getDishIngredients.invalidate({ dishId });
        setEditingId(null);
    };
    const addBaseMutation = trpc.inventoryDish.addIngredientToDish.useMutation({
        onSuccess: () => {
            onSuccessBase();
            setSelectedInventoryId('');
            setQuantityStr('');
        },
    });
    const updateBaseMutation =
        trpc.inventoryDish.updateIngredientQuantity.useMutation({
            onSuccess: onSuccessBase,
        });
    const removeBaseMutation =
        trpc.inventoryDish.removeIngredientFromDish.useMutation({
            onSuccess: onSuccessBase,
        });

    // --- Mutations SKU ---
    const onSuccessSku = () => {
        toast.success('Đã lưu cấu hình riêng cho Tổ hợp này');
        utils.inventoryDish.getSkuIngredients.invalidate({
            skuId: selectedSkuId,
        });
        setEditingId(null);
    };
    const upsertSkuMutation =
        trpc.inventoryDish.upsertSkuIngredient.useMutation({
            onSuccess: () => {
                onSuccessSku();
                setSelectedInventoryId('');
                setQuantityStr('');
            },
        });
    const updateSkuMutation =
        trpc.inventoryDish.updateSkuIngredientQuantity.useMutation({
            onSuccess: onSuccessSku,
        });
    const removeSkuMutation =
        trpc.inventoryDish.removeSkuIngredient.useMutation({
            onSuccess: onSuccessSku,
        });

    const isPending =
        addBaseMutation.isPending ||
        updateBaseMutation.isPending ||
        removeBaseMutation.isPending ||
        upsertSkuMutation.isPending ||
        updateSkuMutation.isPending ||
        removeSkuMutation.isPending;

    // --- Handlers ---
    const handleAdd = () => {
        const quantity = parseFloat(quantityStr);
        if (!selectedInventoryId)
            return toast.error('Vui lòng chọn nguyên liệu');
        if (isNaN(quantity) || quantity <= 0)
            return toast.error('Số lượng không hợp lệ');

        if (!isModeSku) {
            addBaseMutation.mutate({
                dishId,
                inventoryId: selectedInventoryId,
                quantityUsed: quantity,
            });
        } else {
            upsertSkuMutation.mutate({
                skuId: selectedSkuId,
                inventoryId: selectedInventoryId,
                quantityUsed: quantity,
            });
        }
    };

    const handleStartEdit = (item: any) => {
        setEditingId(item.inventoryId);
        setEditingQty(item.quantityUsed.toString());
    };

    const handleSaveEdit = (item: any) => {
        const quantity = parseFloat(editingQty);
        if (isNaN(quantity) || quantity <= 0)
            return toast.error('Số lượng không hợp lệ');

        if (!isModeSku) {
            updateBaseMutation.mutate({
                dishId,
                inventoryId: item.inventoryId,
                data: { quantityUsed: quantity },
            });
        } else {
            // For SKU mode, any edit (even of a base item) acts as an upsert override
            if (item.isBaseInSkuMode && !item.isOverride) {
                upsertSkuMutation.mutate({
                    skuId: selectedSkuId,
                    inventoryId: item.inventoryId,
                    quantityUsed: quantity,
                });
            } else {
                updateSkuMutation.mutate({
                    skuId: selectedSkuId,
                    inventoryId: item.inventoryId,
                    data: { quantityUsed: quantity },
                });
            }
        }
    };

    const handleRemove = (item: any) => {
        if (!isModeSku) {
            if (
                window.confirm(
                    'Chắc chắn xóa nguyên liệu khỏi công thức chung? Mọi SKU chưa ghi đè sẽ bị ảnh hưởng.',
                )
            ) {
                removeBaseMutation.mutate({
                    dishId,
                    inventoryId: item.inventoryId,
                });
            }
        } else {
            if (item.isBaseInSkuMode && !item.isOverride) {
                if (
                    window.confirm(
                        'Loại bỏ nguyên liệu gốc (Tồn tại ở Công thức chung) ra khỏi Biến thể này?',
                    )
                ) {
                    // Exclude it by setting qty to 0 via upsert
                    upsertSkuMutation.mutate({
                        skuId: selectedSkuId,
                        inventoryId: item.inventoryId,
                        quantityUsed: -1,
                    });
                }
            } else if (item.isOverride) {
                if (
                    window.confirm(
                        'Hủy bỏ cấu hình Ghi đè? Nguyên liệu sẽ trở về như mức gốc.',
                    )
                ) {
                    removeSkuMutation.mutate({
                        skuId: selectedSkuId,
                        inventoryId: item.inventoryId,
                    });
                }
            } else {
                // Sku only
                if (window.confirm('Bạn có chắc muốn xóa nguyên liệu này?')) {
                    removeSkuMutation.mutate({
                        skuId: selectedSkuId,
                        inventoryId: item.inventoryId,
                    });
                }
            }
        }
    };

    // Filter out inventory items that are already added (even visually)
    const availableInventoryItems = inventoryItems.filter(
        (item) => !displayList.some((i: any) => i.inventoryId === item.id),
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">
                    Công thức / Định lượng kho
                </h3>
                <div className="w-full sm:w-auto">
                    <Select
                        value={selectedSkuId}
                        onValueChange={setSelectedSkuId}
                    >
                        <SelectTrigger className="w-full sm:w-75 border-primary/20 bg-primary/5">
                            <SelectValue placeholder="Chọn loại thay đổi..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                value="BASE"
                                className="font-semibold text-primary"
                            >
                                🌟 Công thức chung (Toàn món ăn)
                            </SelectItem>
                            {skus.map((sku: any) => (
                                <SelectItem key={sku.id} value={sku.id}>
                                    Tổ hợp:{' '}
                                    {sku.value
                                        .split('-')
                                        .slice(1, -1)
                                        .join(', ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isModeSku && (
                <div className="bg-orange-50/50 p-3 rounded border border-orange-200 mt-2">
                    <p className="text-[13px] text-orange-800 leading-relaxed">
                        Bạn đang cấu hình <strong>Ghi đè</strong> cho riêng biến
                        thể này. Thay đổi ở đây sẽ không ảnh hưởng đến các biến
                        thể khác. Xóa dòng có nhãn <strong>[Kế thừa]</strong> sẽ
                        đánh dấu không dùng nguyên liệu đó cho biến thể này.
                    </p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium">Nguyên liệu</label>
                    <Select
                        value={selectedInventoryId}
                        onValueChange={setSelectedInventoryId}
                        disabled={isLoadingInventory || isPending}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn nguyên liệu muốn thêm / ghi đè..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableInventoryItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.itemName} ({item.unit})
                                </SelectItem>
                            ))}
                            {availableInventoryItems.length === 0 && (
                                <SelectItem value="empty" disabled>
                                    Đã thêm tất cả nguyên liệu
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-32 space-y-2">
                    <label className="text-sm font-medium">Số lượng</label>
                    <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="VD: 50"
                        value={quantityStr}
                        onChange={(e) => setQuantityStr(e.target.value)}
                        disabled={isPending}
                    />
                </div>
                <Button
                    onClick={handleAdd}
                    disabled={isPending || !selectedInventoryId || !quantityStr}
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Plus className="w-4 h-4 mr-2" /> Thêm
                        </>
                    )}
                </Button>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Tên nguyên liệu</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead>Định mức (Lượng trừ)</TableHead>
                            <TableHead className="w-32 text-right">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center"
                                >
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : displayList.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Chưa có cấu hình nguyên liệu nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayList.map((item: any) => (
                                <TableRow
                                    key={item.inventoryId}
                                    className={
                                        item.isOverride || item.isSkuOnly
                                            ? 'bg-orange-50/30'
                                            : ''
                                    }
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {item.inventory?.itemName || 'N/A'}
                                            {isModeSku && item.isOverride && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-5 bg-orange-100 text-orange-700 border-orange-200"
                                                >
                                                    Đã ghi đè
                                                </Badge>
                                            )}
                                            {isModeSku && item.isSkuOnly && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-5 bg-green-100 text-green-700 border-green-200"
                                                >
                                                    Riêng biệt
                                                </Badge>
                                            )}
                                            {isModeSku &&
                                                item.isBaseInSkuMode &&
                                                !item.isOverride && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] h-5 opacity-70"
                                                    >
                                                        Kế thừa
                                                    </Badge>
                                                )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground text-sm">
                                            {item.inventory?.unit || '-'}
                                        </span>
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
                                                        handleSaveEdit(item);
                                                    if (e.key === 'Escape')
                                                        setEditingId(null);
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className={`cursor-pointer transition-colors py-1 inline-block ${item.isOverride || item.isSkuOnly ? 'font-semibold text-orange-700 hover:text-orange-900 border-b border-dashed border-orange-300' : 'hover:text-primary border-b border-dashed border-transparent hover:border-primary'}`}
                                                onClick={() =>
                                                    handleStartEdit(item)
                                                }
                                                title="Bấm để ghi đè số lượng"
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
                                                    handleSaveEdit(item)
                                                }
                                                disabled={isPending}
                                            >
                                                <Save className="w-4 h-4" />
                                            </Button>
                                        ) : isModeSku && item.isOverride ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() =>
                                                    handleRemove(item)
                                                }
                                                disabled={isPending}
                                                title="Hủy ghi đè, về mốc gốc"
                                            >
                                                <Undo2 className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleRemove(item)
                                                }
                                                disabled={isPending}
                                                title={
                                                    isModeSku
                                                        ? 'Xóa khỏi biến thể'
                                                        : 'Xóa khỏi công thức chung'
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
