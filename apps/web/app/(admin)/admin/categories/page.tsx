'use client';

import { useState } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search,
    FolderTree,
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
} from '@/shared/ui/alert-dialog';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { type DishCategoryType, type LanguageType } from '@repo/schema';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { CategoryForm, CategoryFormValues } from './category-form';

type Category = DishCategoryType;

export default function AdminCategoriesPage() {
    const utils = trpc.useUtils();

    // State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editFormDefaultValues, setEditFormDefaultValues] = useState<
        CategoryFormValues | undefined
    >(undefined);

    // Data Fetching
    const { data: categoriesData, isLoading } = trpc.category.list.useQuery({
        page,
        limit,
        search: debouncedSearch,
    });

    const { data: languagesData } = trpc.language.list.useQuery({
        page: 1,
        limit: 100,
    });

    // Safely extract data
    const languages: LanguageType[] = 
        (languagesData && 'data' in languagesData ? (languagesData.data as LanguageType[]) : (Array.isArray(languagesData) ? languagesData : []));

    const categories = categoriesData?.data ?? [];
    const pagination = categoriesData?.pagination || {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    };

    // Mutations
    const createMutation = trpc.category.create.useMutation({
        onSuccess: () => {
            toast.success('Đã tạo danh mục mới');
            utils.category.list.invalidate();
            setOpen(false);
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const updateMutation = trpc.category.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật danh mục');
            utils.category.list.invalidate();
            setOpen(false);
            setEditing(null);
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const deleteMutation = trpc.category.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa danh mục');
            utils.category.list.invalidate();
            setDeleteId(null);
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    // Handlers
    const openCreate = () => {
        setEditing(null);
        setEditFormDefaultValues(undefined);
        setOpen(true);
    };

    const openEdit = (category: Category) => {
        // Intelligent Translation Selection
        const translations = category.dishCategoryTranslations;
        const vi = translations?.find((t) => t.languageId === 'vi');
        const en = translations?.find((t) => t.languageId === 'en');

        const displayLang = vi ? 'vi' : en ? 'en' : 'vi';
        const displayName = vi ? vi.name : en ? en.name : category.name;
        const displayDesc = vi
            ? vi.description
            : en
              ? en.description
              : category.description;

        setEditing(category);
        setEditFormDefaultValues({
            name: displayName || '',
            description: displayDesc || '',
            languageId: displayLang,
        });
        setOpen(true);
    };

    const onSubmit = (values: CategoryFormValues) => {
        if (editing) {
            updateMutation.mutate({
                id: editing.id,
                data: {
                    name: values.name,
                    description: values.description || undefined,
                    languageId: values.languageId,
                },
            });
        } else {
            createMutation.mutate({
                name: values.name,
                description: values.description || '',
                languageId: values.languageId,
            });
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId });
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý danh mục
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quản lý danh mục món ăn.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => utils.category.list.invalidate()}
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
                                Thêm danh mục
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl">
                                    {editing
                                        ? 'Chỉnh sửa danh mục'
                                        : 'Thêm danh mục mới'}
                                </DialogTitle>
                                <div className="sr-only">
                                    <DialogDescription>
                                        Form {editing ? 'chỉnh sửa' : 'tạo mới'}{' '}
                                        danh mục
                                    </DialogDescription>
                                </div>
                            </DialogHeader>

                            <CategoryForm
                                defaultValues={editFormDefaultValues}
                                onSubmit={onSubmit}
                                isLoading={
                                    createMutation.isPending ||
                                    updateMutation.isPending
                                }
                                submitText={editing ? 'Cập nhật' : 'Tạo mới'}
                                onCancel={() => setOpen(false)}
                                languages={languages}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-1">
                <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-primary/80 font-medium">
                            Tổng số danh mục
                        </CardDescription>
                        <CardTitle className="font-display text-4xl text-primary">
                            {pagination.totalItems}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Danh mục đã được tạo
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên danh mục..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 bg-background"
                    />
                </div>
            </div>

            {/* Categories Table */}
            <Card className="shadow-sm border">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground space-y-4">
                            <div className="bg-muted/50 p-4 rounded-full">
                                <FolderTree className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-foreground">
                                    Không tìm thấy danh mục
                                </h3>
                                <p className="text-sm mt-1">
                                    {searchQuery
                                        ? 'Thử thay đổi bộ lọc tìm kiếm'
                                        : 'Hãy tạo danh mục đầu tiên'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-75">
                                            Tên danh mục
                                        </TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead className="text-right w-30">
                                            Thao tác
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow
                                            key={category.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="font-medium">
                                                {category.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div
                                                    className="max-w-md truncate"
                                                    title={category.description}
                                                >
                                                    {category.description ||
                                                        '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEdit(category)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination Controls */}

                    {!isLoading && categories.length > 0 && (
                        <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                            <div className="text-sm text-muted-foreground">
                                Hiển thị{' '}
                                {(pagination.page - 1) * pagination.limit + 1}-
                                {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.totalItems,
                                )}{' '}
                                trong tổng số {pagination.totalItems} kết quả
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={!pagination.hasPrev}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Trước
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(
                                                pagination.totalPages,
                                                p + 1,
                                            ),
                                        )
                                    }
                                    disabled={!pagination.hasNext}
                                >
                                    Sau
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa danh mục
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa danh mục này? Danh mục sẽ bị ẩn
                            khỏi hệ thống nhưng dữ liệu vẫn được lưu trữ.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
