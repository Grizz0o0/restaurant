export const RoleName = {
    Admin: 'ADMIN',
    Client: 'CUSTOMER',
    Manager: 'MANAGER',
    Staff: 'STAFF',
    Guest: 'GUEST',
    Shipper: 'SHIPPER',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];
