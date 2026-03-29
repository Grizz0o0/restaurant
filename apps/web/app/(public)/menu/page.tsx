import { Metadata } from 'next';
import { MenuClient } from './menu-client';

export const metadata: Metadata = {
    title: 'Thực đơn | Bánh Mì Sài Gòn',
    description:
        'Khám phá thực đơn đa dạng các loại bánh mì truyền thống và hiện đại.',
};

export default function Menu() {
    return <MenuClient />;
}
