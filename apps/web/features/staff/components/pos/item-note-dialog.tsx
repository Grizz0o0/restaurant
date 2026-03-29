'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { MessageSquarePlus } from 'lucide-react';

interface ItemNoteDialogProps {
    itemName: string;
    currentNote?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (note: string) => void;
}

export function ItemNoteDialog({
    itemName,
    currentNote = '',
    open,
    onOpenChange,
    onSave,
}: ItemNoteDialogProps) {
    const [note, setNote] = useState(currentNote);

    const handleSave = () => {
        onSave(note.trim());
        onOpenChange(false);
    };

    const handleClear = () => {
        setNote('');
        onSave('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquarePlus className="h-5 w-5 text-primary" />
                        Ghi chú cho món
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <Label className="font-medium text-sm text-muted-foreground">
                        {itemName}
                    </Label>
                    <Textarea
                        placeholder="Ví dụ: Không hành, ít cay, thêm tương..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="min-h-25 resize-none"
                        autoFocus
                        maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {note.length}/200
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    {currentNote && (
                        <Button
                            variant="ghost"
                            onClick={handleClear}
                            className="text-destructive hover:text-destructive"
                        >
                            Xóa ghi chú
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button onClick={handleSave}>Lưu ghi chú</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
