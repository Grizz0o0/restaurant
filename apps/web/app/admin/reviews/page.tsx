'use client';

import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Star,
    Trash2,
    Search,
    MessageSquare,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Download,
    ArrowUpDown,
    MessageCircleReply,
    TrendingUp,
    TrendingDown,
    Minus,
    Send,
    X,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfMonth, getISOWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// ---- Star Rating Display ----
function StarRating({
    rating,
    size = 'sm',
}: {
    rating: number;
    size?: 'sm' | 'md';
}) {
    const cls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${cls} ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
                />
            ))}
        </div>
    );
}

function RatingBadge({ rating }: { rating: number }) {
    const color =
        rating >= 4
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : rating === 3
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-rose-100 text-rose-800 border-rose-200';
    return (
        <Badge className={`${color} gap-1 font-semibold`}>
            <Star className="h-3 w-3 fill-current" />
            {rating}
        </Badge>
    );
}

const PAGE_SIZE = 10;

const TIME_PRESETS = [
    { label: 'Tất cả', value: 'all' },
    { label: '7 ngày qua', value: '7d' },
    { label: '30 ngày qua', value: '30d' },
    { label: 'Tháng này', value: 'thisMonth' },
];

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Cũ nhất', value: 'oldest' },
    { label: 'Điểm thấp nhất', value: 'lowest' },
    { label: 'Điểm cao nhất', value: 'highest' },
];

// ---- Weekly trend chart data ----
function buildWeeklyTrend(reviews: any[]) {
    if (!reviews.length) return [];
    const map: Record<string, { sum: number; count: number }> = {};
    reviews.forEach((r) => {
        const d = new Date(r.createdAt);
        const weekLabel = `T${getISOWeek(d)}/${d.getFullYear()}`;
        if (!map[weekLabel]) map[weekLabel] = { sum: 0, count: 0 };
        map[weekLabel].sum += r.rating;
        map[weekLabel].count += 1;
    });
    return Object.entries(map)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-8) // last 8 weeks
        .map(([week, { sum, count }]) => ({
            week,
            avg: parseFloat((sum / count).toFixed(2)),
        }));
}

// ---- Admin Reply Box ----
function AdminReplyBox({
    reviewId,
    existingReply,
    onClose,
}: {
    reviewId: string;
    existingReply?: string | null;
    onClose: () => void;
}) {
    const utils = trpc.useUtils();
    const [text, setText] = useState(existingReply || '');

    const replyMutation = trpc.review.reply.useMutation({
        onSuccess: () => {
            toast.success('Đã gửi phản hồi');
            utils.review.list.invalidate();
            onClose();
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    return (
        <div className="mt-3 ml-13 pl-3 border-l-2 border-primary/30">
            <div className="flex items-start gap-2">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập phản hồi của quản trị viên..."
                    className="text-sm min-h-20 resize-none"
                />
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="h-7 text-xs"
                >
                    <X className="h-3 w-3 mr-1" />
                    Hủy
                </Button>
                <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={!text.trim() || replyMutation.isPending}
                    onClick={() =>
                        replyMutation.mutate({
                            id: reviewId,
                            adminReply: text.trim(),
                        })
                    }
                >
                    {replyMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <Send className="h-3 w-3" />
                    )}
                    Gửi phản hồi
                </Button>
            </div>
        </div>
    );
}

// ---- Main Page ----
export default function AdminReviewsPage() {
    const utils = trpc.useUtils();

    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRating, setFilterRating] = useState<string>('all');
    const [filterTime, setFilterTime] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [replyingId, setReplyingId] = useState<string | null>(null);

    const { data, isLoading } = trpc.review.list.useQuery({
        page,
        limit: PAGE_SIZE,
    });
    const reviews = data?.data || [];
    const pagination = data?.pagination;

    const deleteMutation = trpc.review.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa đánh giá');
            utils.review.list.invalidate();
            setDeleteId(null);
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    const cutoffDate = useMemo(() => {
        const now = new Date();
        if (filterTime === '7d') return subDays(now, 7);
        if (filterTime === '30d') return subDays(now, 30);
        if (filterTime === 'thisMonth') return startOfMonth(now);
        return null;
    }, [filterTime]);

    const processedReviews = useMemo(() => {
        let result = [...reviews];
        if (cutoffDate)
            result = result.filter(
                (r: any) => new Date(r.createdAt) >= cutoffDate,
            );
        if (filterRating !== 'all')
            result = result.filter(
                (r: any) => r.rating === Number(filterRating),
            );
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (r: any) =>
                    (r.content ?? '').toLowerCase().includes(q) ||
                    (r.user?.name ?? '').toLowerCase().includes(q) ||
                    (r.dish?.dishTranslations?.[0]?.name ?? '').toLowerCase().includes(q),
            );
        }
        result.sort((a: any, b: any) => {
            if (sortBy === 'newest')
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            if (sortBy === 'oldest')
                return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                );
            if (sortBy === 'lowest') return a.rating - b.rating;
            if (sortBy === 'highest') return b.rating - a.rating;
            return 0;
        });
        return result;
    }, [reviews, cutoffDate, filterRating, searchQuery, sortBy]);

    // Stats
    const stats = useMemo(() => {
        if (!reviews.length)
            return { avg: 0, total: 0, dist: {} as Record<number, number> };
        const total = reviews.length;
        const sum = reviews.reduce((s: number, r: any) => s + r.rating, 0);
        const avg = sum / total;
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r: any) => {
            dist[r.rating] = (dist[r.rating] || 0) + 1;
        });
        return { avg, total, dist };
    }, [reviews]);

    // Weekly trend
    const weeklyTrend = useMemo(() => buildWeeklyTrend(reviews), [reviews]);

    const trendDiff =
        weeklyTrend.length >= 2
            ? (weeklyTrend[weeklyTrend.length - 1]?.avg ?? 0) -
              (weeklyTrend[weeklyTrend.length - 2]?.avg ?? 0)
            : 0;

    // Excel export
    const handleExportExcel = () => {
        if (!processedReviews.length) return;
        const wb = XLSX.utils.book_new();
        const rows = [
            [
                'Khách hàng',
                'Điểm',
                'Món ăn',
                'Nội dung',
                'Phản hồi Admin',
                'Ngày đánh giá',
            ],
            ...processedReviews.map((r: any) => [
                r.user?.name || 'Ẩn danh',
                r.rating,
                r.dish?.dishTranslations?.[0]?.name || '',
                r.content,
                r.adminReply || '',
                format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm'),
            ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [
            { wch: 20 },
            { wch: 8 },
            { wch: 25 },
            { wch: 60 },
            { wch: 40 },
            { wch: 18 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Đánh giá');
        XLSX.writeFile(wb, `danh-gia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col p-4 md:p-6 w-full max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Đánh giá & Phản hồi
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Quản lý tất cả đánh giá và nhận xét từ khách hàng.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            disabled={!processedReviews.length}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Xuất Excel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => utils.review.list.invalidate()}
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                {!isLoading && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        {/* Avg Rating */}
                        <Card className="border-l-4 border-l-amber-400">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Điểm trung bình
                                </CardTitle>
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {stats.avg.toFixed(1)}
                                    <span className="text-base font-normal text-muted-foreground ml-1">
                                        / 5
                                    </span>
                                </p>
                                <StarRating rating={Math.round(stats.avg)} />
                            </CardContent>
                        </Card>

                        {/* Distribution with tooltip */}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Phân bố sao
                                </CardTitle>
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = stats.dist[star] || 0;
                                        const pct =
                                            stats.total > 0
                                                ? (count / stats.total) * 100
                                                : 0;
                                        return (
                                            <Tooltip key={star}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 text-xs cursor-default">
                                                        <span className="w-4 text-right">
                                                            {star}
                                                        </span>
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                                                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${star <= 2 ? 'bg-rose-400' : star === 3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                                style={{
                                                                    width: `${pct}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="w-5 text-muted-foreground">
                                                            {count}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        <strong>{count}</strong>{' '}
                                                        đánh giá {star} sao (
                                                        {pct.toFixed(1)}%)
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trend Chart */}
                        <Card className="border-l-4 border-l-emerald-500">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Xu hướng theo tuần
                                </CardTitle>
                                {trendDiff > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : trendDiff < 0 ? (
                                    <TrendingDown className="h-4 w-4 text-rose-500" />
                                ) : (
                                    <Minus className="h-4 w-4 text-muted-foreground" />
                                )}
                            </CardHeader>
                            <CardContent>
                                {weeklyTrend.length < 2 ? (
                                    <p className="text-xs text-muted-foreground py-4 text-center">
                                        Cần ít nhất 2 tuần dữ liệu
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-1 mb-1">
                                            <span
                                                className={`text-sm font-semibold ${trendDiff > 0 ? 'text-emerald-600' : trendDiff < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}
                                            >
                                                {trendDiff > 0 ? '+' : ''}
                                                {trendDiff.toFixed(2)} so với
                                                tuần trước
                                            </span>
                                        </div>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={60}
                                        >
                                            <LineChart data={weeklyTrend}>
                                                <Line
                                                    type="monotone"
                                                    dataKey="avg"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <XAxis dataKey="week" hide />
                                                <YAxis domain={[1, 5]} hide />
                                                <RechartsTooltip
                                                    content={({
                                                        active,
                                                        payload,
                                                        label,
                                                    }) =>
                                                        active &&
                                                        payload?.length ? (
                                                            <div className="bg-background border rounded p-2 text-xs shadow">
                                                                <p className="font-medium">
                                                                    {label}
                                                                </p>
                                                                <p>
                                                                    TB:{' '}
                                                                    {
                                                                        payload[0]
                                                                            ?.value
                                                                    }{' '}
                                                                    ⭐
                                                                </p>
                                                            </div>
                                                        ) : null
                                                    }
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Tìm nội dung, khách hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={filterTime}
                        onValueChange={(v) => {
                            setFilterTime(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_PRESETS.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filterRating}
                        onValueChange={(v) => {
                            setFilterRating(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Lọc sao" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả sao</SelectItem>
                            <SelectItem value="5">⭐⭐⭐⭐⭐ 5 sao</SelectItem>
                            <SelectItem value="4">⭐⭐⭐⭐ 4 sao</SelectItem>
                            <SelectItem value="3">⭐⭐⭐ 3 sao</SelectItem>
                            <SelectItem value="2">⭐⭐ 2 sao</SelectItem>
                            <SelectItem value="1">⭐ 1 sao</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-44">
                            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {!isLoading && (
                    <p className="text-sm text-muted-foreground -mt-2">
                        Hiển thị{' '}
                        <span className="font-medium text-foreground">
                            {processedReviews.length}
                        </span>{' '}
                        đánh giá
                    </p>
                )}

                {/* Reviews List */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-32">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : processedReviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
                                <h3 className="font-semibold text-lg">
                                    Chưa có đánh giá nào
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {searchQuery ||
                                    filterRating !== 'all' ||
                                    filterTime !== 'all'
                                        ? 'Thử thay đổi bộ lọc'
                                        : 'Chưa có khách hàng nào để lại đánh giá.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {processedReviews.map((review: any) => {
                                    const isLow = review.rating <= 2;
                                    const isReplying = replyingId === review.id;
                                    return (
                                        <div
                                            key={review.id}
                                            className={`p-4 md:p-5 transition-colors group ${isLow ? 'bg-rose-50/50 dark:bg-rose-950/10 border-l-4 border-l-rose-400' : 'hover:bg-muted/20'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 shrink-0 border">
                                                    <AvatarImage
                                                        src={
                                                            review.user
                                                                ?.avatar ||
                                                            undefined
                                                        }
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                        {review.user?.name
                                                            ?.charAt(0)
                                                            .toUpperCase() ||
                                                            '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    {/* Header row */}
                                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-sm">
                                                                    {review.user
                                                                        ?.name ||
                                                                        'Ẩn danh'}
                                                                </span>
                                                                <RatingBadge
                                                                    rating={
                                                                        review.rating
                                                                    }
                                                                />
                                                                {isLow && (
                                                                    <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs">
                                                                        Cần xử
                                                                        lý
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <StarRating
                                                                rating={
                                                                    review.rating
                                                                }
                                                            />
                                                            {review.dish?.dishTranslations?.[0]?.name && (
                                                                <div className="mt-1">
                                                                    <span className="text-xs text-muted-foreground mr-1">Món:</span>
                                                                    <span className="text-xs font-medium text-foreground">
                                                                        {review.dish.dishTranslations[0].name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(
                                                                    new Date(
                                                                        review.createdAt,
                                                                    ),
                                                                    'dd/MM/yyyy HH:mm',
                                                                    {
                                                                        locale: vi,
                                                                    },
                                                                )}
                                                            </span>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10"
                                                                        onClick={() =>
                                                                            setReplyingId(
                                                                                isReplying
                                                                                    ? null
                                                                                    : review.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <MessageCircleReply className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Phản hồi
                                                                    đánh giá này
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={() =>
                                                                            setDeleteId(
                                                                                review.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Xóa đánh giá
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>

                                                    {/* Review Content */}
                                                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                                                        {review.content}
                                                    </p>

                                                    {/* Existing Admin Reply */}
                                                    {review.adminReply &&
                                                        !isReplying && (
                                                            <div className="mt-3 ml-0 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-md py-2 pr-2">
                                                                <p className="text-xs font-semibold text-primary mb-1">
                                                                    Phản hồi từ
                                                                    Quản trị
                                                                    viên
                                                                </p>
                                                                <p className="text-sm text-foreground/80 leading-relaxed">
                                                                    {
                                                                        review.adminReply
                                                                    }
                                                                </p>
                                                                <button
                                                                    className="text-xs text-muted-foreground hover:text-primary mt-1 underline"
                                                                    onClick={() =>
                                                                        setReplyingId(
                                                                            review.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Chỉnh sửa
                                                                    phản hồi
                                                                </button>
                                                            </div>
                                                        )}

                                                    {/* Admin Reply Input */}
                                                    {isReplying && (
                                                        <AdminReplyBox
                                                            reviewId={review.id}
                                                            existingReply={
                                                                review.adminReply
                                                            }
                                                            onClose={() =>
                                                                setReplyingId(
                                                                    null,
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Trang {pagination.page} / {pagination.totalPages} ·{' '}
                            {pagination.totalItems} đánh giá
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(pagination.totalPages, p + 1),
                                    )
                                }
                                disabled={!pagination.hasNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation */}
                <AlertDialog
                    open={!!deleteId}
                    onOpenChange={(open) => !open && setDeleteId(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Xóa đánh giá này?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Đánh giá sẽ bị
                                xóa vĩnh viễn.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() =>
                                    deleteId &&
                                    deleteMutation.mutate({ id: deleteId })
                                }
                            >
                                {deleteMutation.isPending && (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
