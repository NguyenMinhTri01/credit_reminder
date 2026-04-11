'use client';

import { useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const t = useTranslations('language');

  const switchLocale = async (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4" />
      <Button variant="ghost" size="sm" onClick={() => switchLocale('vi')}>
        {t('vi')}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => switchLocale('en')}>
        {t('en')}
      </Button>
    </div>
  );
}
