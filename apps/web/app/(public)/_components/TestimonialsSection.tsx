import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
    {
        id: 1,
        name: 'Minh Anh',
        role: 'Food Blogger',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=MinhAnh',
        content:
            'Bánh mì ở đây thực sự xuất sắc! Vỏ bánh giòn tan, nhân pate béo ngậy mà không hề ngấy. Sẽ còn quay lại dài dài.',
        rating: 5,
    },
    {
        id: 2,
        name: 'Tuấn Hưng',
        role: 'Khách hàng thân thiết',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=TuanHung',
        content:
            'Mình ăn ở đây từ hồi quán mới mở. Đến giờ hương vị vẫn không thay đổi, nhất là món xíu mại, nước sốt đậm đà lắm.',
        rating: 5,
    },
    {
        id: 3,
        name: 'Lan Chi',
        role: 'Nhân viên văn phòng',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=LanChi',
        content:
            'Bữa sáng yêu thích của cả phòng mình. Giao hàng nhanh, đồ ăn luôn nóng hổi. Rất recommend mọi người thử trà chanh nha.',
        rating: 4,
    },
];

const TestimonialsSection = () => {
    return (
        <section className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                        Khách hàng nói gì?
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Lời khen từ thực khách
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Niềm vui của chúng tôi là được nhìn thấy nụ cười hài
                        lòng của khách hàng sau mỗi bữa ăn ngon.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-background p-8 rounded-2xl shadow-soft relative animate-fade-in-up"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10 rotate-180" />

                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                            i < item.rating
                                                ? 'text-primary fill-primary'
                                                : 'text-muted'
                                        }`}
                                    />
                                ))}
                            </div>

                            <p className="text-foreground/80 mb-6 leading-relaxed italic">
                                "{item.content}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary">
                                    <Image
                                        src={item.avatar}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                        {item.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
