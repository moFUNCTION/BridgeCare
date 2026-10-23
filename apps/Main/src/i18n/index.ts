import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const applyDirection = (lng: string) => {
  const isArabic = lng.startsWith("ar");
  document.documentElement.lang = isArabic ? "ar" : "en";
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.body.dir = isArabic ? "rtl" : "ltr";
  if (isArabic) {
    document.body.classList.add("rtl");
    document.body.classList.remove("ltr");
  } else {
    document.body.classList.add("ltr");
    document.body.classList.remove("rtl");
  }
};

const savedLanguage =
  (typeof window !== "undefined" && localStorage.getItem("bridgecare_language")) ||
  (typeof navigator !== "undefined" && navigator.language.startsWith("ar") ? "ar" : "en");

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    applyDirection(i18n.language);
  });

i18n.on("languageChanged", (lng: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("bridgecare_language", lng);
  }
  applyDirection(lng);
});

export default i18n;
