export const RoleName = {
    Admin: 'ADMIN',
    Client: 'CUSTOMER',
    Manager: 'MANAGER',
    Staff: 'STAFF',
    Guest: 'GUEST',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];
