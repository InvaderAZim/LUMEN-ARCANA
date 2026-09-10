import { LANGUAGES as LEGACY_LANGUAGES, CARDS as LEGACY_CARDS, DEFAULT_POSTS as LEGACY_POSTS } from "./data_legacy.js";

export const LANGUAGES = LEGACY_LANGUAGES;
export const CARDS = LEGACY_CARDS;
export const DEFAULT_POSTS = LEGACY_POSTS;

const p = (uk, en) => ({ uk, en });
const spread = (id, uk, en, positions) => ({ id, names:{ uk, en }, positions });

export const SPREADS = [
  spread("conflict", "Ясність після конфлікту", "Clarity after conflict", [p("Що я переживаю","What I am experiencing"),p("Яка потреба лишилася непочутою","Which need remains unheard"),p("Чого я ще не знаю","What I do not yet know"),p("Що можу висловити","What I can express"),p("Який крок залежить від мене","Which step is under my control")]),
  spread("closure", "Завершення старої історії", "Closing an old story", [p("Що утримує мою увагу","What keeps my attention"),p("Що я беру з досвіду","What I take from the experience"),p("Яку межу хочу відновити","Which boundary I want to restore"),p("Куди можу спрямувати сили","Where I can direct my energy")]),
  spread("new_relationship", "Готовність до нових стосунків", "Readiness for new relationships", [p("Мої цінності","My values"),p("Важливі потреби","Important needs"),p("Звичний сценарій","Habitual pattern"),p("Доступний крок до нових знайомств","An accessible step toward meeting people")]),
  spread("distance", "Близькість на відстані", "Closeness at a distance", [p("Як я проживаю відстань","How I experience distance"),p("Яка підтримка мені потрібна","What support I need"),p("Що варто узгодити","What needs agreement"),p("Що можу запропонувати для спілкування","What I can offer for communication")]),
  spread("career_choice", "Два професійні напрями", "Two career directions", [p("Критерій вибору","Decision criterion"),p("Ресурс першого варіанта","Resource of option one"),p("Ресурс другого варіанта","Resource of option two"),p("Що перевірити фактами","What to verify with facts"),p("Маленький пробний крок","A small test step")]),
  spread("work_resources", "Робота і власні ресурси", "Work and personal resources", [p("Що забирає сили","What drains energy"),p("Що підтримує","What supports me"),p("Яку межу варто обговорити","Which boundary to discuss"),p("Яку зміну спробувати","Which change to try")]),
  spread("month", "Місяць уваги до себе", "A month of self-attention", [p("Головна тема","Main theme"),p("Стосунки","Relationships"),p("Робочі наміри","Work intentions"),p("Відпочинок","Rest"),p("Одна дія до кінця місяця","One action before month end")]),
  spread("week", "Підсумок тижня", "Weekly reflection", [p("Що помітив","What I noticed"),p("Що хочу залишити","What I want to keep"),p("Що спробую наступного тижня","What I will try next week")])
];

const lesson = (id,no,ukTitle,enTitle,ukGoal,enGoal,ukExercise,enExercise) => ({id,no,title:{uk:ukTitle,en:enTitle},goal:{uk:ukGoal,en:enGoal},exercise:{uk:ukExercise,en:enExercise}});
export const LESSONS = [
  lesson("question","01","Формулювання запиту","Formulating the question","Визначати тему та власну сферу впливу.","Define the theme and your own sphere of influence.","Перепиши запит про невідомі думки іншої людини у запит про власне рішення.","Rewrite a question about another person's unknown thoughts into a question about your own decision."),
  lesson("symbol","02","Символ і припущення","Symbol and inference","Відокремлювати видиму деталь від її тлумачення.","Separate a visible detail from its interpretation.","Опиши карту без прогнозу, а потім запропонуй два можливі прочитання.","Describe a card without prediction, then suggest two possible readings."),
  lesson("position","03","Роль позиції","Role of the position","Розуміти, чому одна карта читається по-різному.","Understand why the same card reads differently by position.","Поясни одну карту в позиціях «ресурс» і «перешкода».","Explain one card in the positions resource and obstacle."),
  lesson("links","04","Зв’язки між картами","Connections between cards","Будувати зв’язний підсумок замість набору загальних фраз.","Build a coherent synthesis instead of generic phrases.","Знайди спільну тему та суперечність у трьох картах.","Find a common theme and a contradiction across three cards."),
  lesson("journal","05","Щоденник практики","Practice journal","Зіставляти власне прочитання з подальшим досвідом.","Compare your reading with later experience.","Запиши припущення сьогодні й повернися до нього через обраний час.","Write down an assumption today and revisit it after a chosen interval."),
  lesson("limits","06","Межі тлумачення","Interpretation boundaries","Помічати необґрунтовану впевненість і тиск.","Notice unsupported certainty and pressure.","Розрізни символічне запитання, вигаданий факт та продаж через страх.","Distinguish a symbolic question, a fabricated fact, and fear-based selling.")
];

export const PREMIUM = [
  p("Розширені тематичні розклади","Extended thematic spreads"),
  p("Синхронізація щоденника між пристроями","Journal synchronization across devices"),
  p("Повна Академія та історія практики","Full Academy and practice history"),
  p("Додаткові колоди лише після перевірки прав і відповідності карт","Additional decks only after rights and card mapping are verified")
];
