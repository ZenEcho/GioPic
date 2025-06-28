import i18n from '@/locales';

export const t = (key: string, ...args: any[]): string => {
    return i18n.global.t(key, args);
};

export const getCurrentLocale = (): string => {
    return i18n.global.locale.value;
};