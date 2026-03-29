import { Metadata } from 'next';
import ReviewsClientPage from './reviews-client';

export const metadata: Metadata = {
    title: 'Đánh Giá | Nhận Xét Của Khách Hàng',
    description: 'Khám phá những đánh giá chân thực từ khách hàng về các món ăn tại nhà hàng chúng tôi. Đóng góp ý kiến của bạn để giúp chúng tôi phục vụ ngày càng tốt hơn.',
};

export default function ReviewsPage() {
    return <ReviewsClientPage />;
}
