import { Award, Clock, Heart, Users } from 'lucide-react';

const stats = [
    {
        icon: Clock,
        value: '40+',
        label: 'Năm kinh nghiệm',
        color: 'text-primary',
    },
    {
        icon: Users,
        value: '50K+',
        label: 'Khách hàng hài lòng',
        color: 'text-herb',
    },
    {
        icon: Award,
        value: '15+',
        label: 'Giải thưởng',
        color: 'text-chili',
    },
    {
        icon: Heart,
        value: '100%',
        label: 'Tình yêu ẩm thực',
        color: 'text-primary',
    },
];

const AboutSection = () => {
    return (
        <section id="about" className="py-20 bg-secondary">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    <div className="space-y-6 animate-fade-in-up">
                        <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider">
                            Câu chuyện của chúng tôi
                        </span>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                            Hơn 40 năm gìn giữ hương vị truyền thống
                        </h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                Từ năm 1985, gia đình chúng tôi đã bắt đầu với
                                một xe đẩy nhỏ trên đường phố Sài Gòn. Mỗi ngày,
                                ông bà thức dậy từ 4 giờ sáng để nhào bột, nướng
                                bánh và chuẩn bị nhân thịt tươi ngon nhất.
                            </p>
                            <p>
                                Qua ba thế hệ, chúng tôi vẫn giữ nguyên công
                                thức bí truyền và tình yêu dành cho ẩm thực
                                đường phố Việt Nam. Mỗi chiếc bánh mì không chỉ
                                là món ăn, mà còn là câu chuyện về gia đình, về
                                truyền thống và niềm tự hào dân tộc.
                            </p>
                        </div>


                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-herb/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg">🌿</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">
                                        Nguyên liệu tươi
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        100% rau củ hữu cơ
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg">👨‍🍳</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">
                                        Đầu bếp lành nghề
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        20+ năm kinh nghiệm
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-chili/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg">🔥</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">
                                        Nướng tại chỗ
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Bánh giòn rụm
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg">❤️</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">
                                        Tình yêu ẩm thực
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Mỗi món là nghệ thuật
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat, index) => (
                            <div
                                key={stat.label}
                                className="bg-card p-6 rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 animate-scale-in text-center"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <stat.icon
                                    className={`w-8 h-8 mx-auto mb-3 ${stat.color}`}
                                />
                                <div className="font-display text-3xl font-bold text-foreground mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
