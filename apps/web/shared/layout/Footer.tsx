import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-foreground text-background py-12 dark:bg-background dark:text-foreground border-t dark:border-border">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 overflow-hidden flex items-center justify-center">
                                <Image
                                    src="/images/logo-trans.png"
                                    alt="BAMIXO Logo"
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <span className="font-display text-2xl font-bold tracking-tight">
                                    BAMIXO
                                </span>
                            </div>
                        </div>
                        <p className="text-background/70 text-sm leading-relaxed dark:text-muted-foreground">
                            Hương vị truyền thống Bánh Mì & Xôi Việt Nam, nâng
                            tầm phong cách hiện đại.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Liên kết nhanh</h4>
                        <ul className="space-y-2 text-background/70 text-sm dark:text-muted-foreground">
                            <li>
                                <Link
                                    href="/"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Trang chủ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/menu"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Thực đơn
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Về chúng tôi
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Liên hệ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="font-semibold mb-4">Dịch vụ</h4>
                        <ul className="space-y-2 text-background/70 text-sm dark:text-muted-foreground">
                            <li>
                                <Link
                                    href="/menu"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Đặt hàng online
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/reservation"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Đặt bàn
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Tiệc & sự kiện
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="hover:text-background transition-colors dark:hover:text-foreground"
                                >
                                    Nhượng quyền
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4">Liên hệ</h4>
                        <ul className="space-y-2 text-background/70 text-sm dark:text-muted-foreground">
                            <li>
                                Kiến Hưng, Hà Đông, Hà Nội (Chung cư Mipec City
                                View)
                            </li>
                            <li>0363290475</li>
                            <li>hello@banhmi-xoi.com</li>
                            <li>Mở cửa: 6:00 - 22:00</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-background/10 pt-8 text-center text-background/50 text-sm dark:border-border dark:text-muted-foreground">
                    <p>© {currentYear} BAMIXO. Tất cả quyền được bảo lưu.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
