export const en = {
    header: {
        title: 'GPS-tracker',
        navbar: {
            general: {
                label: 'GENERAL',
                options: [
                    { label: 'Dashboard', dataI18n: 'dashboard', href: '/' },
                    { label: 'Devices', dataI18n: 'devices', href: '/devices' },
                    { label: 'Alerts', dataI18n: 'alerts', href: '/alerts' },
                    { label: 'Profile', dataI18n: 'profile', href: '/profile' },
                ],
            },
            admin: {
                label: 'Admin',
                options: [
                    { label: 'Users', dataI18n: 'users', href: '/users' },
                    {
                        label: 'All devices',
                        dataI18n: 'all-devices',
                        href: '/all-devices',
                    },
                ],
            },
        },
    },
};

/** Derived type used to enforce structural parity across all locales. */
export type Translation = typeof en;
