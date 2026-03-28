'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search,
    UtensilsCrossed,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DishIngredients } from '@/components/admin/dishes/dish-ingredients';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';

type Category = {
    id: string;
    name: string;
    slug: string;
};

type Dish = {
    id: string;
    category_id: string | null;
    name: string;
    description: string | null;
    price_vnd: number;
    image_url: string | null;
    is_active: boolean;
};

const dishSchema = z.object({
    name: z.string().trim().min(1, 'Tên món không được trống').max(200),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    price_vnd: z.number().int().min(0).max(1_000_000_000),
    category_id: z.string().optional().or(z.literal('')),
    supplier_id: z.string().min(1, 'Vui lòng chọn nhà cung cấp'),
    language_id: z.string().min(1, 'Vui lòng chọn ngôn ngữ'),
    image_url: z
        .string()
        .trim()
        .url('Image URL không hợp lệ')
        .max(1000)
        .optional()
        .or(z.literal('')),
    is_active: z.boolean(),
    variants: z
        .array(
            z.object({
                id: z.string().optional(),
                name: z.string().min(1, 'Tên biến thể không được trống'),
                options: z
                    .array(z.object({ value: z.string() }))
                    .min(1, 'Cần ít nhất 1 tùy chọn'),
            }),
        )
        .optional(),
    skus: z
        .array(
            z.object({
                id: z.string().optional(),
                value: z.string(),
                price: z.number().min(0),
                stock: z.number().int().min(0),
                optionValues: z.array(z.string()),
            }),
        )
        .optional(),
});

type DishFormValues = z.infer<typeof dishSchema>;

function generateSkuCombinations(
    variants: { name: string; options: { value: string }[] }[],
) {
    if (!variants || variants.length === 0) return [];

    const groupedVariants: Record<string, string[]> = {};

    variants.forEach((v) => {
        const name = v.name.trim().toLowerCase();
        if (!name) return;

        if (!groupedVariants[name]) {
            groupedVariants[name] = [];
        }

        const group = groupedVariants[name];
        v.options.forEach((opt) => {
            if (opt.value && !group.includes(opt.value)) {
                group.push(opt.value);
            }
        });
    });

    const optionsList = Object.values(groupedVariants).filter(
        (opts) => opts.length > 0,
    );
    if (optionsList.length === 0) return [];

    function cartesianProduct(arrays: string[][]): string[][] {
        return arrays.reduce<string[][]>(
            (acc, curr) => {
                const results: string[][] = [];
                acc.forEach((a) => {
                    curr.forEach((b) => {
                        results.push([...a, b]);
                    });
                });
                return results;
            },
            [[]],
        );
    }

    const combinations = cartesianProduct(optionsList);

    return combinations.map((combo) => ({
        optionValues: combo,
        value: `SKU-${combo.join('-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
    }));
}

function SkuSynchronizer({
    form,
    replaceSkus,
    skuFields,
}: {
    form: any;
    replaceSkus: (vals: any[]) => void;
    skuFields: any[];
}) {
    const variants = useWatch({
        control: form.control,
        name: 'variants',
    });
    const basePrice = useWatch({
        control: form.control,
        name: 'price_vnd',
    });

    useEffect(() => {
        if (variants && variants.length > 0) {
            const isValid = variants.every(
                (v: any) => v.options && v.options.length > 0,
            );
            if (!isValid) return;

            const combinations = generateSkuCombinations(variants as any);
            const currentSkus = form.getValues('skus') || [];

            const newSkus = combinations.map((c) => {
                const existingSku = currentSkus.find(
                    (s: any) =>
                        JSON.stringify(
                            [...(s.optionValues || [])].slice().sort(),
                        ) ===
                        JSON.stringify([...c.optionValues].slice().sort()),
                );

                return {
                    id: existingSku?.id,
                    value: existingSku?.value || c.value,
                    price: existingSku ? existingSku.price : basePrice || 0,
                    stock: existingSku ? existingSku.stock : 0,
                    optionValues: c.optionValues,
                };
            });

            const currentKeys = JSON.stringify(
                currentSkus.map((s: any) =>
                    [...(s.optionValues || [])].slice().sort(),
                ),
            );
            const newKeys = JSON.stringify(
                newSkus.map((s: any) =>
                    [...(s.optionValues || [])].slice().sort(),
                ),
            );

            if (currentKeys !== newKeys) {
                replaceSkus(newSkus);
            }
        } else if (skuFields.length > 0) {
            replaceSkus([]);
        }
    }, [variants, basePrice]);

    return null;
}

export default function AdminDishesPage() {
    const utils = trpc.useUtils();

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: categoriesData } = trpc.category.list.useQuery({
        page: 1,
        limit: 100,
    });
    const { data: dishesData, isLoading } = trpc.dish.list.useQuery({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        categoryId: filterCategory === 'all' ? undefined : filterCategory,
        isActive:
            filterStatus === 'all' ? undefined : filterStatus === 'active',
    });

    const { data: languagesData } = trpc.language.list.useQuery({
        page: 1,
        limit: 100,
    });

    const languagesRaw = languagesData as any;
    const languages = Array.isArray(languagesRaw)
        ? languagesRaw
        : languagesRaw?.data || [];

    const { data: suppliersData } = trpc.supplier.list.useQuery({
        page: 1,
        limit: 100,
    });

    const suppliers: any[] = suppliersData?.data ?? [];
    const categories = categoriesData?.data || [];
    const dishes = dishesData?.data || [];

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const form = useForm<DishFormValues>({
        resolver: zodResolver(dishSchema),
        defaultValues: {
            name: '',
            description: '',
            price_vnd: 0,
            category_id: '',
            supplier_id: '',
            language_id: 'vi',
            image_url: '',
            is_active: true,
            variants: [],
            skus: [],
        },
    });

    const {
        fields: variantFields,
        append: appendVariant,
        remove: removeVariant,
    } = useFieldArray({
        control: form.control,
        name: 'variants',
    });

    const { fields: skuFields, replace: replaceSkus } = useFieldArray({
        control: form.control,
        name: 'skus',
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCategory, filterStatus]);

    // Using useEffect to set it when suppliers load
    useEffect(() => {
        if (
            !form.getValues('supplier_id') &&
            suppliers.length > 0 &&
            !editing
        ) {
            const internalSupplier = suppliers.find(
                (s) => s.name === 'Tự chế biến',
            );
            form.setValue(
                'supplier_id',
                internalSupplier ? internalSupplier.id : suppliers[0].id,
            );
        }
    }, [suppliers, form, editing]);

    const categoryNameById = useMemo(() => {
        const map = new Map<string, string>();
        categories.forEach((c) => {
            if (c.id && c.name) {
                map.set(c.id, c.name);
            }
        });
        return map;
    }, [categories]);

    const createMutation = trpc.dish.create.useMutation({
        onSuccess: () => {
            toast.success('Đã tạo món ăn mới');
            utils.dish.list.invalidate();
            setOpen(false);
            form.reset();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const updateMutation = trpc.dish.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật món ăn');
            utils.dish.list.invalidate();
            setOpen(false);
            setEditing(null);
            form.reset();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const toggleActiveMutation = trpc.dish.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái món ăn');
            utils.dish.list.invalidate();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const openCreate = () => {
        setEditing(null);
        const internalSupplier = suppliers.find(
            (s) => s.name === 'Tự chế biến',
        );
        form.reset({
            name: '',
            description: '',
            price_vnd: 0,
            category_id: '',
            supplier_id: internalSupplier
                ? internalSupplier.id
                : suppliers.length > 0
                  ? suppliers[0].id
                  : '',
            language_id: 'vi',
            image_url: '',
            is_active: true,
            variants: [],
        });
        setOpen(true);
    };

    const openEdit = (dish: any) => {
        // Intelligent Translation Selection
        const vi = dish.dishTranslations?.find(
            (t: any) => t.languageId === 'vi',
        );
        const en = dish.dishTranslations?.find(
            (t: any) => t.languageId === 'en',
        );

        const displayLang = vi ? 'vi' : en ? 'en' : 'vi';
        const displayName = vi ? vi.name : en ? en.name : dish.name;
        const displayDesc = vi
            ? vi.description
            : en
              ? en.description
              : dish.description;

        setEditing(dish);
        form.reset({
            name: displayName,
            description: displayDesc ?? '',
            price_vnd: Number(dish.basePrice),
            category_id: dish.categories?.[0]?.id ?? '',
            supplier_id:
                dish.supplierId ??
                (suppliers.length > 0 ? suppliers[0].id : ''),
            language_id: displayLang,
            image_url: dish.images?.[0] ?? '',
            is_active: dish.isActive ?? true,
            variants:
                dish.variants?.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    options: (v.options || v.variantOptions || []).map(
                        (o: any) => ({
                            value: o.value || o,
                        }),
                    ),
                })) ?? [],
            skus:
                dish.skus?.map((s: any) => ({
                    id: s.id,
                    value: s.value,
                    price: Number(s.price),
                    stock: s.stock,
                    optionValues:
                        s.variantOptions?.map((o: any) => o.value) ?? [],
                })) ?? [],
        });
        setOpen(true);
    };

    const onSubmit = (values: DishFormValues) => {
        const variants = values.variants?.map((v) => ({
            id: v.id,
            name: v.name,
            options: v.options.map((o) => o.value),
        }));

        const skus = values.skus?.map((s) => ({
            id: s.id,
            value: s.value,
            price: s.price,
            stock: s.stock,
            optionValues: s.optionValues,
        }));

        if (editing) {
            updateMutation.mutate({
                id: editing.id,
                data: {
                    name: values.name,
                    description: values.description || undefined,
                    basePrice: values.price_vnd,
                    categoryIds: values.category_id ? [values.category_id] : [],
                    images: values.image_url ? [values.image_url] : [],
                    isActive: values.is_active,
                    supplierId: values.supplier_id,
                    languageId: values.language_id,
                    variants: variants,
                    skus: skus,
                },
            });
        } else {
            createMutation.mutate({
                name: values.name,
                description: values.description || '',
                basePrice: values.price_vnd,
                categoryIds: values.category_id ? [values.category_id] : [],
                images: values.image_url ? [values.image_url] : [],
                isActive: true,
                supplierId: values.supplier_id,
                languageId: values.language_id,
                variants: variants,
                skus: skus,
            });
        }
    };

    const handleToggleActive = (dish: any) => {
        setDeleteId(dish.id);
    };

    const confirmToggle = () => {
        if (deleteId) {
            const dish = dishes.find((d) => d.id === deleteId);
            if (dish) {
                toggleActiveMutation.mutate({
                    id: deleteId,
                    data: { isActive: !dish.isActive },
                });
            }
            setDeleteId(null);
        }
    };

    const formatVnd = (vnd: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(vnd);

    const filteredDishes = useMemo(() => {
        return dishes;
    }, [dishes]);

    const stats = useMemo(() => {
        const total = dishesData?.pagination.totalItems || dishes.length;
        const active = dishes.filter((d) => d.isActive).length;
        const inactive = dishes.filter((d) => !d.isActive).length;
        return { total, active, inactive };
    }, [dishes, dishesData?.pagination.totalItems]);

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý món ăn
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quản lý danh sách, giá cả và trạng thái hiển thị của món
                        ăn.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => utils.dish.list.invalidate()}
                    >
                        Làm mới
                    </Button>
                    <Dialog
                        open={open}
                        onOpenChange={(v) => {
                            setOpen(v);
                            if (!v) setEditing(null);
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="hero"
                                onClick={openCreate}
                                className="gap-2 shadow-lg hover:shadow-primary/25"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm món mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl">
                                    {editing
                                        ? 'Chỉnh sửa món ăn'
                                        : 'Thêm món ăn mới'}
                                </DialogTitle>
                            </DialogHeader>

                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-auto">
                                    <TabsTrigger
                                        value="basic"
                                        className="py-2 text-xs sm:text-sm"
                                    >
                                        Thông tin cơ bản
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="ingredients"
                                        disabled={!editing}
                                        className="py-2 text-xs sm:text-sm"
                                    >
                                        Công thức / Nguyên liệu
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="basic">
                                    <Form {...form}>
                                        <form
                                            onSubmit={form.handleSubmit(
                                                onSubmit,
                                            )}
                                            className="space-y-6 pt-4"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1 sm:col-span-2">
                                                            <FormLabel>
                                                                Tên món
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Ví dụ: Bánh mì đặc biệt"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="category_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Danh mục
                                                            </FormLabel>
                                                            <Select
                                                                value={
                                                                    field.value ||
                                                                    ''
                                                                }
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn danh mục" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {categories.map(
                                                                        (c) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    c.id
                                                                                }
                                                                                value={
                                                                                    c.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    c.name
                                                                                }
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
                                                    name="price_vnd"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Giá bán (VNĐ)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                                                        ₫
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        className="pl-7"
                                                                        min={0}
                                                                        step={
                                                                            1000
                                                                        }
                                                                        {...field}
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            field.onChange(
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Mô tả chi tiết
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                rows={3}
                                                                placeholder="Thành phần, hương vị..."
                                                                className="resize-none"
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
                                                    name="supplier_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Nhà cung cấp
                                                            </FormLabel>
                                                            <Select
                                                                value={
                                                                    field.value ||
                                                                    ''
                                                                }
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn NCC" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {suppliers.map(
                                                                        (s) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    s.id
                                                                                }
                                                                                value={
                                                                                    s.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    s.name
                                                                                }
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
                                                    name="language_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Ngôn ngữ
                                                            </FormLabel>
                                                            <Select
                                                                value={
                                                                    field.value ||
                                                                    'vi'
                                                                }
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn ngôn ngữ" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {languages.map(
                                                                        (
                                                                            l: any,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    l.id
                                                                                }
                                                                                value={
                                                                                    l.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    l.name
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="image_url"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Hình ảnh
                                                        </FormLabel>
                                                        <FormControl>
                                                            <ImageUpload
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="is_active"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                Đang kinh doanh
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                Hiển thị món này
                                                                trên thực đơn
                                                                của khách hàng.
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        field.value
                                                                    }
                                                                    onChange={
                                                                        field.onChange
                                                                    }
                                                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="space-y-4 pt-4 border-t">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-lg">
                                                        Biến thể (Size, Topping)
                                                    </h3>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            appendVariant({
                                                                name: '',
                                                                options: [
                                                                    {
                                                                        value: '',
                                                                    },
                                                                ],
                                                            })
                                                        }
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Thêm biến thể
                                                    </Button>
                                                </div>

                                                {variantFields.map(
                                                    (field, index) => (
                                                        <div
                                                            key={field.id}
                                                            className="p-4 border rounded-lg space-y-4 bg-muted/10 relative"
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    removeVariant(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>

                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`variants.${index}.name`}
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem>
                                                                        <FormLabel>
                                                                            Tên
                                                                            biến
                                                                            thể
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Ví dụ: Size, Mức đường, Topping..."
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <div className="space-y-2">
                                                                <FormLabel>
                                                                    Tùy chọn
                                                                    (ngăn cách
                                                                    bằng dấu
                                                                    phẩy)
                                                                </FormLabel>
                                                                <FormField
                                                                    control={
                                                                        form.control
                                                                    }
                                                                    name={`variants.${index}.options`}
                                                                    render={({
                                                                        field,
                                                                    }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Ví dụ: S, M, L hoặc Trân châu, Thạch..."
                                                                                    defaultValue={
                                                                                        field.value
                                                                                            ?.map(
                                                                                                (
                                                                                                    o: any,
                                                                                                ) =>
                                                                                                    o.value,
                                                                                            )
                                                                                            .join(
                                                                                                ', ',
                                                                                            ) ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const values =
                                                                                            e.target.value
                                                                                                .split(
                                                                                                    ',',
                                                                                                )
                                                                                                .map(
                                                                                                    (
                                                                                                        v,
                                                                                                    ) => ({
                                                                                                        value: v.trim(),
                                                                                                    }),
                                                                                                )
                                                                                                .filter(
                                                                                                    (
                                                                                                        v,
                                                                                                    ) =>
                                                                                                        v.value !==
                                                                                                        '',
                                                                                                );
                                                                                        field.onChange(
                                                                                            values,
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Nhập
                                                                                các
                                                                                lựa
                                                                                chọn
                                                                                cách
                                                                                nhau
                                                                                bởi
                                                                                dấu
                                                                                phẩy.
                                                                            </p>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>

                                            {variantFields.length > 0 && (
                                                <div className="space-y-4 pt-6 border-t mt-6 bg-muted/20 p-4 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-base font-semibold text-primary">
                                                                Thiết lập giá
                                                                theo tổ hợp
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Hệ thống tự động
                                                                tạo danh sách
                                                                dựa trên các
                                                                biến thể bên
                                                                trên.
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="hidden"
                                                            onClick={() => {
                                                                const currentVariants =
                                                                    form.getValues(
                                                                        'variants',
                                                                    );
                                                                if (
                                                                    currentVariants &&
                                                                    currentVariants.length >
                                                                        0
                                                                ) {
                                                                    const combinations =
                                                                        generateSkuCombinations(
                                                                            currentVariants as any,
                                                                        );
                                                                    const basePrice =
                                                                        form.getValues(
                                                                            'price_vnd',
                                                                        ) || 0;
                                                                    const currentSkus =
                                                                        form.getValues(
                                                                            'skus',
                                                                        ) || [];

                                                                    const newSkus =
                                                                        combinations.map(
                                                                            (
                                                                                c,
                                                                            ) => {
                                                                                const existingSku =
                                                                                    currentSkus.find(
                                                                                        (
                                                                                            s,
                                                                                        ) =>
                                                                                            JSON.stringify(
                                                                                                [
                                                                                                    ...(s.optionValues ||
                                                                                                        []),
                                                                                                ].sort(),
                                                                                            ) ===
                                                                                            JSON.stringify(
                                                                                                [
                                                                                                    ...c.optionValues,
                                                                                                ].sort(),
                                                                                            ),
                                                                                    );

                                                                                return {
                                                                                    id: existingSku?.id,
                                                                                    value:
                                                                                        existingSku?.value ||
                                                                                        c.value,
                                                                                    price: existingSku
                                                                                        ? existingSku.price
                                                                                        : basePrice,
                                                                                    stock: existingSku
                                                                                        ? existingSku.stock
                                                                                        : 0,
                                                                                    optionValues:
                                                                                        c.optionValues,
                                                                                };
                                                                            },
                                                                        );
                                                                    replaceSkus(
                                                                        newSkus,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            Cập nhật bảng giá
                                                        </Button>
                                                    </div>

                                                    <SkuSynchronizer
                                                        form={form}
                                                        replaceSkus={
                                                            replaceSkus
                                                        }
                                                        skuFields={skuFields}
                                                    />

                                                    {skuFields.length > 0 ? (
                                                        <div className="border rounded-md divide-y overflow-hidden bg-white shadow-sm">
                                                            <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                                                <div className="col-span-7">
                                                                    Tổ hợp biến
                                                                    thể (Size,
                                                                    Topping...)
                                                                </div>
                                                                <div className="col-span-5 text-right">
                                                                    Giá bán
                                                                    riêng (VNĐ)
                                                                </div>
                                                            </div>
                                                            {skuFields.map(
                                                                (
                                                                    field,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            field.id
                                                                        }
                                                                        className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30 transition-colors"
                                                                    >
                                                                        <div className="col-span-7 flex flex-wrap gap-1.5">
                                                                            {field.optionValues.map(
                                                                                (
                                                                                    val,
                                                                                    idx,
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        variant="secondary"
                                                                                        className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200"
                                                                                    >
                                                                                        {
                                                                                            val
                                                                                        }
                                                                                    </Badge>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                        <div className="col-span-5">
                                                                            <FormField
                                                                                control={
                                                                                    form.control
                                                                                }
                                                                                name={`skus.${index}.price`}
                                                                                render={({
                                                                                    field: skuField,
                                                                                }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <div className="relative">
                                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                                                                                    ₫
                                                                                                </span>
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    className="h-9 pl-7 text-right font-medium focus-visible:ring-primary/30"
                                                                                                    value={
                                                                                                        skuField.value
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e,
                                                                                                    ) =>
                                                                                                        skuField.onChange(
                                                                                                            Number(
                                                                                                                e
                                                                                                                    .target
                                                                                                                    .value,
                                                                                                            ),
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-white/50">
                                                            <p className="text-sm text-muted-foreground">
                                                                Vui lòng nhập
                                                                tên biến thể và
                                                                các tùy chọn ở
                                                                trên để bắt đầu
                                                                thiết lập giá.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-3 justify-end pt-4 border-t">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setOpen(false)
                                                    }
                                                >
                                                    Hủy bỏ
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="hero"
                                                    className="min-w-25"
                                                >
                                                    {editing
                                                        ? 'Lưu thay đổi'
                                                        : 'Tạo món mới'}
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </TabsContent>
                                <TabsContent
                                    value="ingredients"
                                    className="pt-4"
                                >
                                    {editing && (
                                        <DishIngredients dishId={editing.id} />
                                    )}
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary/80 font-medium">
                            Tổng số món ăn
                        </CardDescription>
                        <CardTitle className="text-4xl font-display text-primary">
                            {stats.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Trong thực đơn của nhà hàng
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Đang kinh doanh</CardDescription>
                        <CardTitle className="text-4xl font-display text-green-600">
                            {stats.active}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Sẵn sàng phục vụ khách hàng
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Món đã ẩn</CardDescription>
                        <CardTitle className="text-4xl font-display text-muted-foreground">
                            {stats.inactive}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Các món đang tạm dừng phục vụ
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo tên món..."
                        className="pl-9 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Select
                        value={filterCategory}
                        onValueChange={setFilterCategory}
                    >
                        <SelectTrigger className="w-45 bg-background">
                            <SelectValue placeholder="Danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả danh mục</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                    >
                        <SelectTrigger className="w-40 bg-background">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Tất cả trạng thái
                            </SelectItem>
                            <SelectItem value="active">
                                Đang kinh doanh
                            </SelectItem>
                            <SelectItem value="inactive">Đang ẩn</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : filteredDishes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/25">
                        <div className="bg-muted p-4 rounded-full">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="max-w-105">
                            <h3 className="text-lg font-semibold">
                                Không tìm thấy món ăn
                            </h3>
                            <p className="text-muted-foreground mt-1">
                                Không có món ăn nào khớp với bộ lọc hiện tại của
                                bạn.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery('');
                                setFilterCategory('all');
                                setFilterStatus('all');
                            }}
                        >
                            Xóa bộ lọc
                        </Button>
                    </div>
                ) : (
                    filteredDishes.map((dish) => {
                        const dishName: string = dish.name ?? 'Món ăn';
                        const rawImage = dish.images?.[0];
                        const imageSrc =
                            typeof rawImage === 'string' ? rawImage.trim() : '';

                        return (
                            <div
                                key={dish.id}
                                className="group relative flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50"
                            >
                                <div className="aspect-4/3 bg-muted relative overflow-hidden">
                                    {imageSrc ? (
                                        <Image
                                            src={imageSrc}
                                            alt={dishName}
                                            fill
                                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-muted-foreground">
                                            <UtensilsCrossed className="h-10 w-10 opacity-20" />
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2">
                                        {!dish.isActive && (
                                            <Badge
                                                variant="destructive"
                                                className="shadow-sm"
                                            >
                                                Đang ẩn
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                            {dishName}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {dish.categories?.map((c) => {
                                            const catName =
                                                c.name ||
                                                categoryNameById.get(c.id) ||
                                                'N/A';
                                            return (
                                                <Badge
                                                    key={c.id}
                                                    variant="secondary"
                                                    className="px-2 py-0 h-6 font-normal text-xs bg-muted/80 text-muted-foreground"
                                                >
                                                    {catName}
                                                </Badge>
                                            );
                                        })}
                                        {(!dish.categories ||
                                            dish.categories.length === 0) && (
                                            <span className="text-xs text-muted-foreground italic">
                                                Chưa phân loại
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                                        {dish.description || 'Chưa có mô tả...'}
                                    </p>

                                    <div className="mt-auto pt-3 flex items-center justify-between border-t">
                                        <span className="font-display font-bold text-lg text-primary">
                                            {formatVnd(Number(dish.basePrice))}
                                        </span>

                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={() => openEdit(dish)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                                <span className="sr-only">
                                                    Sửa
                                                </span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleToggleActive(dish)
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="sr-only">
                                                    {dish.isActive
                                                        ? 'Ẩn'
                                                        : 'Hiện'}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {dishesData?.pagination && dishesData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-6">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị{' '}
                        <span className="font-medium text-foreground">
                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                        </span>{' '}
                        đến{' '}
                        <span className="font-medium text-foreground">
                            {Math.min(
                                currentPage * ITEMS_PER_PAGE,
                                dishesData.pagination.totalItems,
                            )}
                        </span>{' '}
                        trong tổng số{' '}
                        <span className="font-medium text-foreground">
                            {dishesData.pagination.totalItems}
                        </span>{' '}
                        món ăn
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={!dishesData.pagination.hasPrev}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Trang trước
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from(
                                { length: dishesData.pagination.totalPages },
                                (_, i) => i + 1,
                            )
                                .filter((p) => {
                                    return (
                                        p === 1 ||
                                        p ===
                                            dishesData.pagination.totalPages ||
                                        Math.abs(p - currentPage) <= 1
                                    );
                                })
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && (
                                            <span className="text-muted-foreground px-1">
                                                ...
                                            </span>
                                        )}
                                        <Button
                                            variant={
                                                p === currentPage
                                                    ? 'hero'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            className="w-9 h-9 p-0"
                                            onClick={() => setCurrentPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    </React.Fragment>
                                ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(
                                        dishesData.pagination.totalPages,
                                        p + 1,
                                    ),
                                )
                            }
                            disabled={!dishesData.pagination.hasNext}
                            className="gap-1"
                        >
                            Trang sau
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Toggle Active/Inactive Dialog */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {dishes.find((d) => d.id === deleteId)?.isActive
                                ? 'Ẩn món ăn này?'
                                : 'Hiện lại món ăn này?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dishes.find((d) => d.id === deleteId)?.isActive
                                ? 'Món ăn sẽ bị ẩn khỏi thực đơn khách hàng nhưng dữ liệu vẫn được lưu trữ. Bạn có thể hiện lại bất cứ lúc nào.'
                                : 'Món ăn sẽ hiển thị trở lại trên thực đơn khách hàng.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmToggle}
                            className={
                                dishes.find((d) => d.id === deleteId)?.isActive
                                    ? 'bg-destructive hover:bg-destructive/90'
                                    : 'bg-primary hover:bg-primary/90'
                            }
                        >
                            {dishes.find((d) => d.id === deleteId)?.isActive
                                ? 'Ẩn món ăn'
                                : 'Hiện món ăn'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
