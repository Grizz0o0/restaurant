'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Clock, Mail, Send } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';

const contactInfo = [
    {
        icon: MapPin,
        title: 'Địa chỉ',
        content: 'Kiến Hưng, Hà Đông, Hà Nội',
    },
    {
        icon: Phone,
        title: 'Điện thoại',
        content: '0363290475',
    },
    {
        icon: Mail,
        title: 'Email',
        content: 'hello@banhmisaigon.vn',
    },
    {
        icon: Clock,
        title: 'Giờ mở cửa',
        content: '6:00 - 22:00 (Thứ 2 - Chủ nhật)',
    },
];

const branches = [
    {
        name: 'Chi nhánh Kiến Hưng',
        address: 'Kiến Hưng, Hà Đông, Hà Nội (Chung cư Mipec City View)',
        phone: '0363290475',
        hours: '6:00 - 22:00',
    },
    {
        name: 'Chi nhánh Quận 3',
        address: 'Quận 3, TP. Hồ Chí Minh',
        phone: '0909 123 457',
        hours: '6:00 - 21:00',
    },
    {
        name: 'Chi nhánh Quận 7',
        address: 'Quận 7, TP. Hồ Chí Minh',
        phone: '0909 123 458',
        hours: '6:30 - 22:00',
    },
];

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success('Gửi thành công!', {
            description:
                'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.',
        });

        setFormData({ name: '', email: '', phone: '', message: '' });
        setIsSubmitting(false);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-secondary/50 border-b border-border">
                <div className="container mx-auto px-4 py-16">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                        Liên Hệ
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Chúng tôi luôn sẵn sàng lắng nghe bạn
                    </p>
                </div>
            </header>

            {/* Contact Info */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {contactInfo.map((item, index) => (
                            <div
                                key={index}
                                className="bg-card p-6 rounded-2xl border border-border text-center hover:shadow-warm transition-shadow"
                            >
                                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-medium text-foreground mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Form & Map */}
            <section className="py-16 bg-secondary/30">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="bg-card p-8 rounded-2xl border border-border">
                            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                                Gửi tin nhắn cho chúng tôi
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-foreground mb-2"
                                    >
                                        Họ và tên
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Nguyễn Văn A"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Email
                                        </label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Số điện thoại
                                        </label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="0363290475"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="message"
                                        className="block text-sm font-medium text-foreground mb-2"
                                    >
                                        Nội dung
                                    </label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Nhập nội dung tin nhắn..."
                                        rows={5}
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    variant="hero"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        'Đang gửi...'
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Gửi tin nhắn
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Map Placeholder */}
                        <div className="bg-card rounded-2xl border border-border overflow-hidden">
                            <div className="aspect-square lg:aspect-auto lg:h-full bg-secondary/50 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                                        Cửa hàng Kiến Hưng
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Kiến Hưng, Hà Đông, Hà Nội
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        (Bản đồ sẽ được tích hợp Google Maps)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Branches */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
                        Hệ thống chi nhánh
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {branches.map((branch, index) => (
                            <div
                                key={index}
                                className="bg-card p-6 rounded-2xl border border-border hover:shadow-warm transition-shadow"
                            >
                                <h3 className="font-display text-lg font-bold text-foreground mb-4">
                                    {branch.name}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">
                                            {branch.address}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-muted-foreground">
                                            {branch.phone}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-muted-foreground">
                                            {branch.hours}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
