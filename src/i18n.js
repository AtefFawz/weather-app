// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "./locales/en/translation.json";
import arTranslation from "./locales/ar/translation.json";

i18n

  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,

    fallbackLng: "en",

    supportedLngs: ["en", "ar"],

    interpolation: {
      escapeValue: false,
    },

    resources: {
      en: {
        translation: enTranslation,
      },
      ar: {
        translation: arTranslation,
      },
    },

    detection: {
      order: [
        "queryString",
        "cookie",
        "localStorage",
        "sessionStorage",
        "navigator",
      ],
      caches: ["localStorage"],
    },

    defaultNS: "translation",
  });

export default i18n;
