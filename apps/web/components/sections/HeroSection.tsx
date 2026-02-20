import Image from 'next/image';
import { ArrowRight, Clock, MapPin, Star } from 'lucide-react';
import heroBanhMi from '@/assets/hero-banh-mi2.jpg';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
    return (
        <section
            id="home"
            className="relative min-h-screen pt-20 overflow-hidden"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-warm dark:bg-none dark:bg-background" />

            {/* Decorative elements */}
            <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-herb/5 rounded-full blur-3xl" />

            <div className="container relative mx-auto px-4 pb-12 md:pb-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
                    {/* Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span className="text-sm font-medium text-secondary-foreground">
                                Đánh giá 4.9/5 từ 2000+ khách hàng
                            </span>
                        </div>

                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                            Bánh Mì
                            <span className="text-gradient-warm block mt-2">
                                & Xôi
                            </span>
                            <span className="block text-2xl md:text-3xl font-medium text-muted-foreground mt-4">
                                Hương vị Việt Nam
                            </span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                            Thưởng thức bánh mì giòn rụm và xôi nóng dẻo thơm,
                            kết hợp cùng các loại topping đậm đà, mang đến bữa
                            ăn trọn vẹn năng lượng cho ngày mới.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="hero" size="xl">
                                Xem thực đơn
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <Button variant="warm" size="xl">
                                Đặt bàn
                            </Button>
                        </div>

                        {/* Quick info */}
                        <div className="flex flex-wrap gap-6 pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-5 h-5 text-herb" />
                                <span className="text-sm">
                                    Mở cửa: 6:00 - 22:00
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-5 h-5 text-chili" />
                                <span className="text-sm">
                                    Kiến Hưng, Hà Đông, Hà Nội (Chung cư Mipec
                                    City View)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative animate-fade-in">
                        <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-elevated">
                            <Image
                                src={heroBanhMi}
                                alt="Bánh mì Sài Gòn thơm ngon"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-linear-to-t from-foreground/20 to-transparent" />
                        </div>

                        {/* Floating cards */}
                        <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-card animate-float">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-herb/10 flex items-center justify-center">
                                    <span className="text-2xl">🥬</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-card-foreground">
                                        100% Tươi
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Nguyên liệu sạch
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="absolute -top-4 -right-4 bg-card p-4 rounded-2xl shadow-card animate-float"
                            style={{ animationDelay: '1s' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl">🔥</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-card-foreground">
                                        Nướng tại chỗ
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Bánh giòn rụm
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
