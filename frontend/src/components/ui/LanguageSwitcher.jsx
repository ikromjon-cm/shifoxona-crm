import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find(l => l.code === i18n.language) || languages[0];

  const change = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5 text-sm"
        title="Til"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 glass rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-700/30 overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => change(lang.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                i18n.language === lang.code ? 'font-semibold text-medical-500' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
