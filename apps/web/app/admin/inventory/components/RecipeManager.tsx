'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
    Loader2,
    ChefHat,
    Plus,
    Trash2,
    Pencil,
    Search,
    UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const recipeSchema = z.object({
    dishId: z.string().uuid('Vui lòng chọn món ăn'),
    inventoryId: z.string().uuid('Vui lòng chọn nguyên liệu'),
    quantityUsed: z.coerce.number().positive('Số lượng phải lớn hơn 0'),
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

export function RecipeManager() {
    const [selectedDishId, setSelectedDishId] = useState<string>('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<any>(null);
    const [searchDish, setSearchDish] = useState('');

    const utils = trpc.useUtils();

    // Queries
    const { data: dishesData, isLoading: isLoadingDishes } =
        trpc.dish.list.useQuery({
            page: 1,
            limit: 100,
        });
    const { data: inventoryData } = trpc.inventory.list.useQuery({
        page: 1,
        limit: 100,
    });
    const { data: ingredientsData, isLoading: isLoadingIngredients } =
        trpc.inventoryDish.getDishIngredients.useQuery(
            { dishId: selectedDishId },
            { enabled: !!selectedDishId },
        );

    const dishes = dishesData?.data || [];
    const inventoryItems = inventoryData?.data || [];
    const ingredients = ingredientsData?.data || [];

    const filteredDishes = useMemo(() => {
        return dishes.filter((d: any) => {
            const name = d.dishTranslations?.[0]?.name?.toLowerCase() || '';
            return name.includes(searchDish.toLowerCase());
        });
    }, [dishes, searchDish]);

    // Mutations
    const addMutation = trpc.inventoryDish.addIngredientToDish.useMutation({
        onSuccess: () => {
            toast.success('Đã thêm nguyên liệu vào món ăn');
            utils.inventoryDish.getDishIngredients.invalidate({
                dishId: selectedDishId,
            });
            setIsAddOpen(false);
            form.reset();
        },
        onError: (err) => toast.error(err.message),
    });

    const updateMutation =
        trpc.inventoryDish.updateIngredientQuantity.useMutation({
            onSuccess: () => {
                toast.success('Đã cập nhật định lượng');
                utils.inventoryDish.getDishIngredients.invalidate({
                    dishId: selectedDishId,
                });
                setEditingIngredient(null);
            },
            onError: (err) => toast.error(err.message),
        });

    const removeMutation =
        trpc.inventoryDish.removeIngredientFromDish.useMutation({
            onSuccess: () => {
                toast.success('Đã xóa nguyên liệu khỏi món ăn');
                utils.inventoryDish.getDishIngredients.invalidate({
                    dishId: selectedDishId,
                });
            },
            onError: (err) => toast.error(err.message),
        });

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeSchema) as Resolver<RecipeFormValues>,
        defaultValues: {
            dishId: '',
            inventoryId: '',
            quantityUsed: 0,
        },
    });

    const onAddSubmit = (values: RecipeFormValues) => {
        addMutation.mutate(values);
    };

    const handleOpenAdd = () => {
        if (!selectedDishId) {
            toast.error('Vui lòng chọn một món ăn trước');
            return;
        }
        form.reset({
            dishId: selectedDishId,
            inventoryId: '',
            quantityUsed: 0,
        });
        setIsAddOpen(true);
    };

    const handleEdit = (ing: any) => {
        setEditingIngredient(ing);
        // Implement direct update or a separate dialog if needed
        const newQty = prompt(
            `Nhập định lượng mới cho ${ing.inventory.itemName} (${ing.inventory.unit}):`,
            ing.quantityUsed,
        );
        if (newQty && !isNaN(Number(newQty))) {
            updateMutation.mutate({
                inventoryId: ing.inventoryId,
                dishId: selectedDishId,
                data: { quantityUsed: Number(newQty) },
            });
        }
    };

    const handleRemove = (inventoryId: string) => {
        if (
            confirm('Bạn có chắc chắn muốn xóa nguyên liệu này khỏi công thức?')
        ) {
            removeMutation.mutate({ inventoryId, dishId: selectedDishId });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Dish Selection Sidebar */}
            <Card className="md:col-span-4 lg:col-span-3 border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                        Danh sách món ăn
                    </CardTitle>
                    <CardDescription>
                        Chọn món để bắt đầu thiết lập
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm món ăn..."
                            className="pl-9 h-9 border-muted bg-card/50"
                            value={searchDish}
                            onChange={(e) => setSearchDish(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1 max-h-150 overflow-y-auto pr-2 scrollbar-thin">
                        {isLoadingDishes ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : filteredDishes.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground p-4 bg-muted/20 rounded-lg">
                                Không tìm thấy món ăn nào
                            </p>
                        ) : (
                            filteredDishes.map((dish: any) => (
                                <button
                                    key={dish.id}
                                    onClick={() => setSelectedDishId(dish.id)}
                                    className={cn(
                                        'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                                        selectedDishId === dish.id
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'hover:bg-muted hover:border-muted-foreground/20 border-transparent text-foreground/80',
                                    )}
                                >
                                    {dish.dishTranslations?.[0]?.name ||
                                        'Không có tên'}
                                </button>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recipe Details */}
            <Card className="md:col-span-8 lg:col-span-9 border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ChefHat className="h-5 w-5 text-primary" />
                            Công thức và Định lượng
                        </CardTitle>
                        <CardDescription>
                            {selectedDishId
                                ? `Thiết lập nguyên liệu cho: ${dishes.find((d: any) => d.id === selectedDishId)?.dishTranslations?.[0]?.name}`
                                : 'Vui lòng chọn một món ăn từ danh sách bên trái'}
                        </CardDescription>
                    </div>
                    {selectedDishId && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="gap-2 shadow-sm"
                                variant="hero"
                                onClick={handleOpenAdd}
                            >
                                <Plus className="h-4 w-4" /> Thêm nguyên liệu
                            </Button>
                        </div>
                    )}
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogContent className="sm:max-w-106.25">
                            <DialogHeader>
                                <DialogTitle>
                                    Thêm nguyên liệu vào món
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onAddSubmit)}
                                    className="space-y-5 pt-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="inventoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nguyên vật liệu (Kho)
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Chọn nguyên liệu" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="max-h-60">
                                                        {inventoryItems.map(
                                                            (item: any) => (
                                                                <SelectItem
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    value={
                                                                        item.id
                                                                    }
                                                                >
                                                                    {
                                                                        item.itemName
                                                                    }{' '}
                                                                    ({item.unit}
                                                                    )
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantityUsed"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Số lượng (Định lượng)
                                                </FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            className="h-10 pr-12"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-muted-foreground font-medium bg-muted/30 px-2 rounded-r-md border-l">
                                                        {inventoryItems.find(
                                                            (i: any) =>
                                                                i.id ===
                                                                form.watch(
                                                                    'inventoryId',
                                                                ),
                                                        )?.unit || '-'}
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter className="pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full sm:w-auto"
                                            variant="hero"
                                            disabled={addMutation.isPending}
                                        >
                                            {addMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Thêm vào công thức
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="px-0 pt-4">
                    {!selectedDishId ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-2xl bg-muted/10">
                            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">
                                Chưa có món ăn được chọn
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                                Hãy chọn một món từ danh sách bên trái để thiết
                                lập công thức.
                            </p>
                        </div>
                    ) : isLoadingIngredients ? (
                        <div className="flex justify-center p-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-semibold px-4 py-3">
                                            Nguyên liệu
                                        </TableHead>
                                        <TableHead className="font-semibold px-4 py-3">
                                            Định lượng
                                        </TableHead>
                                        <TableHead className="font-semibold px-4 py-3">
                                            Đơn vị
                                        </TableHead>
                                        <TableHead className="font-semibold px-4 py-3 text-right">
                                            Thao tác
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ingredients.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="h-40 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <ChefHat className="h-8 w-8 opacity-20" />
                                                    <p>
                                                        Món ăn này chưa có định
                                                        lượng nguyên liệu.
                                                    </p>
                                                    <p className="text-xs font-normal opacity-70">
                                                        Nhấn nút "Thêm nguyên
                                                        liệu" để bắt đầu.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ingredients.map((ing: any) => (
                                            <TableRow
                                                key={`${ing.dishId}-${ing.inventoryId}`}
                                                className="hover:bg-muted/30 transition-colors group"
                                            >
                                                <TableCell className="px-4 py-3 font-medium">
                                                    {ing.inventory?.itemName}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 font-bold tabular-nums">
                                                    {ing.quantityUsed}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-muted-foreground">
                                                    {ing.inventory?.unit}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                            onClick={() =>
                                                                handleEdit(ing)
                                                            }
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={() =>
                                                                handleRemove(
                                                                    ing.inventoryId,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
