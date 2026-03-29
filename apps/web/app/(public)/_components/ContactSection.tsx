import { Button } from '@/shared/ui/button';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

const ContactSection = () => {
    return (
        <section id="contact" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                        Liên hệ
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Ghé thăm chúng tôi
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Đến trực tiếp để thưởng thức bánh mì nóng hổi hoặc đặt
                        hàng trước để tiết kiệm thời gian.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-card p-6 rounded-2xl shadow-soft">
                            <h3 className="font-display text-xl font-semibold text-card-foreground mb-6">
                                Thông tin liên hệ
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-card-foreground">
                                            Địa chỉ
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Kiến Hưng, Hà Đông, Hà Nội (Chung cư
                                            Mipec City View)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-herb/10 flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-herb" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-card-foreground">
                                            Điện thoại
                                        </h4>
                                        <p className="text-muted-foreground">
                                            0363290475
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-chili/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-chili" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-card-foreground">
                                            Email
                                        </h4>
                                        <p className="text-muted-foreground">
                                            hello@banhmi-xoi.com
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-card-foreground">
                                            Giờ mở cửa
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Thứ 2 - Chủ nhật: 6:00 - 22:00
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="hero" size="lg" className="flex-1">
                                Đặt hàng online
                            </Button>
                            <Button variant="warm" size="lg" className="flex-1">
                                Đặt bàn
                            </Button>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="bg-card rounded-2xl shadow-soft overflow-hidden h-100 md:h-auto min-h-100">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4109.296562172954!2d105.78856857556868!3d20.951673090421092!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135adb298ee59bd%3A0x699b8daf626f4564!2zTWlwZWMgS2nhur9uIEjGsG5nIEjDoCDEkMO0bmc!5e1!3m2!1svi!2s!4v1769609771539!5m2!1svi!2s"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Bản đồ quán Bánh Mì"
                        ></iframe>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
