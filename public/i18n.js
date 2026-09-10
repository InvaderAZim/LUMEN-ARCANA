import { DICTIONARIES as LEGACY } from "./i18n_legacy.js";

const extraEn = {
  journal:"Journal", academy:"Academy", brand:"LUMEN ARCANA", tagline:"The cards reflect. The decisions remain yours.",
  chooseSpread:"Choose a theme", questionPh:"What is important for me to understand about this situation?", again:"New reading",
  journalEmpty:"No saved readings yet.", academyTitle:"LUMEN Academy", premium:"LUMEN+", reminders:"Reminders", off:"Off", daily:"Daily", weekly:"Weekly",
  gateTitle:"Beta access", gateText:"Enter an invitation code.", enter:"Enter", invalid:"This code is not active.", demo:"Demo: LUMEN-BETA",
  observation:"Observation", symbolism:"Symbolic theme", position:"Position", context:"Context", practice:"Practice", caution:"Boundaries",
  saved:"Reading saved", completed:"Lesson marked complete", delete:"Delete", openApp:"Open LUMEN ARCANA",
  mode:"Interpretation mode", legacyReading:"Previous reading", circleLocal:"Arcana Circle remains local on this device during beta."
};

const extraUk = {
  journal:"Щоденник", academy:"Академія", brand:"LUMEN ARCANA", tagline:"Карти віддзеркалюють. Рішення залишаються за тобою.",
  chooseSpread:"Обери тему", questionPh:"Що мені важливо зрозуміти про цю ситуацію?", again:"Новий розклад",
  journalEmpty:"Ще немає збережених розкладів.", academyTitle:"Академія LUMEN", premium:"LUMEN+", reminders:"Нагадування", off:"Вимкнено", daily:"Щодня", weekly:"Щотижня",
  gateTitle:"Вхід у beta", gateText:"Введи код запрошення.", enter:"Увійти", invalid:"Код не активний.", demo:"Демо: LUMEN-BETA",
  observation:"Спостереження", symbolism:"Символічна тема", position:"Позиція", context:"Контекст", practice:"Практика", caution:"Межі",
  saved:"Розклад збережено", completed:"Урок позначено пройденим", delete:"Видалити", openApp:"Відкрити LUMEN ARCANA",
  mode:"Режим тлумачення", legacyReading:"Попередній розклад", circleLocal:"Коло Арканів у beta зберігається локально на цьому пристрої."
};

export const DICTIONARIES = Object.fromEntries(
  Object.entries(LEGACY).map(([code, dictionary]) => [code, { ...dictionary, ...extraEn }])
);
DICTIONARIES.uk = { ...LEGACY.uk, ...extraEn, ...extraUk };
DICTIONARIES.en = { ...LEGACY.en, ...extraEn };
export function t(language, key) { return DICTIONARIES[language]?.[key] ?? DICTIONARIES.en[key] ?? key; }
