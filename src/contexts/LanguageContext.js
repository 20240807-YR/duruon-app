import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('drt_lang') || 'ko'
  );

  // html 요소에 data-lang 속성 설정 → CSS 폰트 적용용
  useEffect(() => {
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const setLang = (l) => {
    localStorage.setItem('drt_lang', l);
    setLangState(l);
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ko;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
