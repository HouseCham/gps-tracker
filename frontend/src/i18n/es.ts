import type { Translation } from './en';

export const es: Translation = {
    header: {
        title: 'GPS-tracker',
        navbar: {
            general: {
                label: 'GENERAL',
                options: [
                    { label: 'Tablero', dataI18n: 'dashboard', href: '/', },
                    { label: 'Dispositivos', dataI18n: 'devices', href: '/devices' },
                    { label: 'Alertas', dataI18n: 'alerts', href: '/alerts' },
                    { label: 'Perfil', dataI18n: 'profile', href: '/profile' }
                ]
            },
            admin: {
                label: 'Admin',
                options: [
                    { label: 'Usuarios', dataI18n: 'users', href: '/users' },
                    { label: 'Todos los dispositivos', dataI18n: 'all-devices', href: '/all-devices' }
                ]
            }
        }
    }
};