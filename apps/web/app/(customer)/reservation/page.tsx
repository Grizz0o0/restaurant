'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { Calendar } from '@/shared/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Users } from 'lucide-react';

export default function ReservationPage() {
    const [page, setPage] = useState(1);
    const { data: tablesData, isLoading } = trpc.table.list.useQuery({
        page,
        limit: 12,
    });
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    // Form State
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('18:00');
    const [guests, setGuests] = useState(2);
    const [notes, setNotes] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const createReservationMutation = trpc.reservation.create.useMutation({
        onSuccess: () => {
            toast.success('Reservation created successfully!');
            setIsDialogOpen(false);
            setSelectedTable(null);
            // Reset form
            setGuests(2);
            setNotes('');
        },
        onError: (err) => {
            toast.error(`Failed to create reservation: ${err.message}`);
        },
    });

    const handleBook = () => {
        if (!selectedTable || !date) return;

        // Combine date and time
        const [hours = 0, minutes = 0] = time.split(':').map(Number);
        const reservationTime = new Date(date);
        reservationTime.setHours(hours, minutes);

        createReservationMutation.mutate({
            tableId: selectedTable,
            reservationTime: reservationTime.toISOString(),
            guests,
            notes,
            durationMinutes: 120, // Default
            channel: 'WEB',
        });
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Reserve a Table</h1>

            {isLoading ? (
                <div>Loading tables...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tablesData?.data.map((table: any) => (
                        <Card
                            key={table.id}
                            className={cn(
                                'border-2',
                                table.status === 'OCCUPIED' ? 'opacity-50' : '',
                            )}
                        >
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    Table {table.tableNumber}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4" />
                                    <span>Capacity: {table.capacity}</span>
                                </div>
                                <div className="capitalize">
                                    Status:{' '}
                                    <span
                                        className={
                                            table.status === 'AVAILABLE'
                                                ? 'text-green-600 font-bold'
                                                : 'text-gray-500'
                                        }
                                    >
                                        {table.status}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Dialog
                                    open={
                                        isDialogOpen &&
                                        selectedTable === table.id
                                    }
                                    onOpenChange={(open) => {
                                        setIsDialogOpen(open);
                                        if (!open) setSelectedTable(null);
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            className="w-full"
                                            disabled={
                                                table.status !== 'AVAILABLE'
                                            }
                                            onClick={() =>
                                                setSelectedTable(table.id)
                                            }
                                        >
                                            {table.status === 'AVAILABLE'
                                                ? 'Book Now'
                                                : 'Unavailable'}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Book Table {table.tableNumber}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            {/* Date Picker */}
                                            <div className="grid gap-2">
                                                <Label>Date</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={'outline'}
                                                            className={cn(
                                                                'w-full justify-start text-left font-normal',
                                                                !date &&
                                                                    'text-muted-foreground',
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {date ? (
                                                                format(
                                                                    date,
                                                                    'PPP',
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Pick a date
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={date}
                                                            onSelect={setDate}
                                                            initialFocus
                                                            disabled={(
                                                                date: Date,
                                                            ) =>
                                                                date <
                                                                new Date()
                                                            }
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Time */}
                                            <div className="grid gap-2">
                                                <Label>Time</Label>
                                                <Input
                                                    type="time"
                                                    value={time}
                                                    onChange={(e) =>
                                                        setTime(e.target.value)
                                                    }
                                                />
                                            </div>

                                            {/* Guests */}
                                            <div className="grid gap-2">
                                                <Label>Guests</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={table.capacity}
                                                    value={guests}
                                                    onChange={(e) =>
                                                        setGuests(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Notes */}
                                            <div className="grid gap-2">
                                                <Label>Notes</Label>
                                                <Textarea
                                                    value={notes}
                                                    onChange={(e) =>
                                                        setNotes(e.target.value)
                                                    }
                                                    placeholder="Allergies, special requests..."
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleBook}
                                            disabled={
                                                createReservationMutation.isPending
                                            }
                                        >
                                            {createReservationMutation.isPending
                                                ? 'Booking...'
                                                : 'Confirm Reservation'}
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
