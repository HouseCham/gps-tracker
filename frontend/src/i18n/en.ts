export const en = {
    header: {
        title: 'GPS-tracker',
        navbar: [
            { label: 'Dashboard', dataI18n: 'dashboard', href: '/' },
            { label: 'Devices', dataI18n: 'devices', href: '/devices' },
            { label: 'Alerts', dataI18n: 'alerts', href: '/alerts' },
            { label: 'Profile', dataI18n: 'profile', href: '/profile' },
            { label: 'Admin', dataI18n: 'admin', href: '/admin' }
        ]
    }
}

/** Derived type used to enforce structural parity across all locales. */
export type Translation = typeof en;