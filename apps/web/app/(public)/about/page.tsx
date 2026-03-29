'use client';

import Link from 'next/link';
import { ArrowLeft, Award, Users, Clock, Heart } from 'lucide-react';
import Image from 'next/image';

import heroImage from '@/assets/hero-banh-mi.jpg';

const stats = [
    { icon: Clock, value: '15+', label: 'Năm kinh nghiệm' },
    { icon: Users, value: '50K+', label: 'Khách hàng hài lòng' },
    { icon: Award, value: '12', label: 'Giải thưởng ẩm thực' },
    { icon: Heart, value: '100%', label: 'Tình yêu trong từng ổ bánh' },
];

const values = [
    {
        title: 'Chất lượng là trên hết',
        description:
            'Chúng tôi chỉ sử dụng nguyên liệu tươi ngon nhất, từ thịt heo được tuyển chọn kỹ lưỡng đến rau sống organic từ nông trại địa phương.',
    },
    {
        title: 'Công thức gia truyền',
        description:
            'Bí quyết gia truyền được lưu giữ qua 3 thế hệ, tạo nên hương vị độc đáo không thể nhầm lẫn của Bánh Mì Sài Gòn.',
    },
    {
        title: 'Phục vụ tận tâm',
        description:
            'Đội ngũ nhân viên được đào tạo bài bản, luôn sẵn sàng phục vụ với nụ cười và sự nhiệt tình.',
    },
    {
        title: 'Giá cả hợp lý',
        description:
            'Chúng tôi tin rằng món ăn ngon không nhất thiết phải đắt đỏ. Bánh mì ngon cho mọi người, mọi nhà.',
    },
];

const About = () => {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-secondary/50 border-b border-border">
                <div className="container mx-auto px-4 py-16">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                        Về Chúng Tôi
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Câu chuyện về hành trình của Bánh Mì Sài Gòn
                    </p>
                </div>
            </header>

            {/* Hero Story */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="aspect-4/3 rounded-3xl overflow-hidden relative">
                                <Image
                                    src={heroImage}
                                    alt="Bánh Mì Sài Gòn"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-2xl shadow-warm hidden md:block z-10">
                                <p className="font-display text-2xl font-bold">
                                    Từ 2009
                                </p>
                                <p className="text-sm opacity-90">
                                    Phục vụ khách hàng
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                                Hơn 15 năm gìn giữ{' '}
                                <span className="text-primary">
                                    hương vị truyền thống
                                </span>
                            </h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    Bánh Mì Sài Gòn được thành lập vào năm 2009
                                    bởi ông Nguyễn Văn Minh, một nghệ nhân bánh
                                    mì với hơn 30 năm kinh nghiệm trong nghề.
                                    Khởi đầu từ một xe bánh mì nhỏ ở góc phố
                                    Quận 1, chúng tôi đã dần phát triển thành
                                    một thương hiệu được yêu thích.
                                </p>
                                <p>
                                    Công thức bánh mì của chúng tôi được truyền
                                    lại từ đời ông nội, kết hợp với sự sáng tạo
                                    và cải tiến không ngừng để phù hợp với khẩu
                                    vị hiện đại nhưng vẫn giữ được hồn cốt Sài
                                    Gòn xưa.
                                </p>
                                <p>
                                    Mỗi ổ bánh mì ra lò đều mang theo tình yêu,
                                    sự tận tâm và niềm tự hào về ẩm thực Việt
                                    Nam. Đó là lý do tại sao khách hàng luôn
                                    quay lại và giới thiệu cho bạn bè, người
                                    thân.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-secondary/30">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <stat.icon className="w-8 h-8 text-primary" />
                                </div>
                                <p className="font-display text-3xl md:text-4xl font-bold text-foreground">
                                    {stat.value}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Giá trị cốt lõi
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Những nguyên tắc định hướng mọi hoạt động của chúng
                            tôi
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="bg-card p-8 rounded-2xl border border-border hover:shadow-warm transition-shadow"
                            >
                                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mb-4">
                                    <span className="text-2xl font-bold text-primary-foreground">
                                        {index + 1}
                                    </span>
                                </div>
                                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gradient-hero">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                        Ghé thăm chúng tôi ngay hôm nay
                    </h2>
                    <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
                        Hãy đến và trải nghiệm hương vị bánh mì Sài Gòn chính
                        hiệu
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3 rounded-full font-medium hover:bg-background/90 transition-colors"
                    >
                        Xem địa chỉ
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default About;
