const APP_ORIGIN = "https://lumen-arcana.kraplenii.workers.dev";
export const TELEGRAM_APP_URL = APP_ORIGIN + "/";
export const TELEGRAM_WEBHOOK_PATH = "/telegram/webhook";

const encoder = new TextEncoder();
let ensureAt = 0;
let ensurePromise = null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

async function readJson(request) {
  const raw = await request.text();
  if (encoder.encode(raw).length > 49152) return { error: "body_too_large", status: 413 };
  try {
    return { value: JSON.parse(raw || "{}") };
  } catch {
    return { error: "invalid_json", status: 400 };
  }
}

function languageOf(message) {
  return String(message?.from?.language_code || "").toLowerCase().startsWith("uk") ? "uk" : "en";
}

function appKeyboard(language = "uk") {
  return {
    inline_keyboard: [[{
      text: language === "uk" ? "Відкрити LUMEN ARCANA ✦" : "Open LUMEN ARCANA ✦",
      web_app: { url: TELEGRAM_APP_URL }
    }]]
  };
}

function menuButton() {
  return {
    type: "web_app",
    text: "LUMEN ARCANA",
    web_app: { url: TELEGRAM_APP_URL }
  };
}

function commands(language = "uk") {
  if (language === "uk") {
    return [
      { command: "start", description: "Відкрити LUMEN ARCANA" },
      { command: "app", description: "Запустити застосунок" },
      { command: "premium", description: "Про Premium Beta" },
      { command: "help", description: "Довідка" }
    ];
  }
  return [
    { command: "start", description: "Open LUMEN ARCANA" },
    { command: "app", description: "Launch the app" },
    { command: "premium", description: "About Premium Beta" },
    { command: "help", description: "Help" }
  ];
}

async function telegram(env, method, payload = {}) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error("telegram_not_configured");

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(`${method}: ${data.description || response.status}`);
  }
  return data.result;
}

async function reply(chatId, text, env, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  };
  if (keyboard) payload.reply_markup = keyboard;
  return telegram(env, "sendMessage", payload);
}

async function onStart(message, env, language) {
  const text = language === "uk"
    ? "✦ LUMEN ARCANA\n\nПерсональний простір для Таро, натальної карти, щоденника та саморефлексії.\n\nПід час beta Premium відкритий для всіх без оплати."
    : "✦ LUMEN ARCANA\n\nA personal space for Tarot, natal tools, journaling and reflection.\n\nDuring beta, Premium is open to everyone for free.";

  await reply(message.chat.id, text, env, appKeyboard(language));
}

async function onApp(message, env, language) {
  const text = language === "uk"
    ? "Відкрий актуальну LUMEN ARCANA:"
    : "Open the current LUMEN ARCANA:";
  await reply(message.chat.id, text, env, appKeyboard(language));
}

async function onPremium(message, env, language) {
  const text = language === "uk"
    ? "✦ Premium Beta\n\nУ поточній beta-версії всі Premium-функції LUMEN ARCANA доступні користувачам без оплати."
    : "✦ Premium Beta\n\nIn the current beta, all LUMEN ARCANA Premium features are available to users for free.";
  await reply(message.chat.id, text, env, appKeyboard(language));
}

async function onHelp(message, env, language) {
  const text = language === "uk"
    ? "LUMEN ARCANA працює як Telegram Mini App.\n\n/start — головний вхід\n/app — відкрити застосунок\n/premium — статус Premium Beta\n/help — ця довідка"
    : "LUMEN ARCANA works as a Telegram Mini App.\n\n/start — main entry\n/app — open the app\n/premium — Premium Beta status\n/help — this help";
  await reply(message.chat.id, text, env, appKeyboard(language));
}

async function onUnknown(message, env, language) {
  const text = language === "uk"
    ? "Основна взаємодія з LUMEN ARCANA відбувається всередині застосунку."
    : "The main LUMEN ARCANA experience is inside the app.";
  await reply(message.chat.id, text, env, appKeyboard(language));
}

export async function handleTelegramUpdate(update, env) {
  const message = update?.message;
  if (!message?.chat?.id) return { ignored: true };

  const language = languageOf(message);
  const command = String(message.text || "")
    .trim()
    .split(/\s+/)[0]
    .split("@")[0]
    .toLowerCase();

  if (command === "/start") await onStart(message, env, language);
  else if (command === "/app") await onApp(message, env, language);
  else if (command === "/premium") await onPremium(message, env, language);
  else if (command === "/help") await onHelp(message, env, language);
  else await onUnknown(message, env, language);

  return { handled: true, command: command || "message" };
}

export async function handleTelegramWebhook(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: "telegram_not_configured" }, 503);
  }
  if ((request.headers.get("x-telegram-bot-api-secret-token") || "") !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const parsed = await readJson(request);
  if (parsed.error) return json({ error: parsed.error }, parsed.status);

  await handleTelegramUpdate(parsed.value, env);
  return json({ ok: true });
}

export async function configureTelegramBot(env, { force = false } = {}) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return { ok: false, configured: false, reason: "missing_secrets" };
  }

  const now = Date.now();
  if (!force && ensurePromise) return ensurePromise;
  if (!force && now - ensureAt < 600000) {
    return { ok: true, configured: true, cached: true, appUrl: TELEGRAM_APP_URL };
  }

  ensurePromise = (async () => {
    const webhookUrl = APP_ORIGIN + TELEGRAM_WEBHOOK_PATH;
    const info = await telegram(env, "getWebhookInfo", {});

    if (force || info?.url !== webhookUrl) {
      await telegram(env, "setWebhook", {
        url: webhookUrl,
        secret_token: env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ["message"],
        drop_pending_updates: false
      });
    }

    await Promise.all([
      telegram(env, "setChatMenuButton", { menu_button: menuButton() }),
      telegram(env, "setMyCommands", { commands: commands("uk"), language_code: "uk" }),
      telegram(env, "setMyCommands", { commands: commands("en") })
    ]);

    ensureAt = Date.now();
    return {
      ok: true,
      configured: true,
      appUrl: TELEGRAM_APP_URL,
      webhookUrl,
      webhookChanged: force || info?.url !== webhookUrl
    };
  })().catch(error => ({
    ok: false,
    configured: true,
    error: String(error?.message || error)
  })).finally(() => {
    ensurePromise = null;
  });

  return ensurePromise;
}

export async function handleTelegramSetup(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!env.ADMIN_SECRET) return json({ error: "setup_not_configured" }, 503);
  if ((request.headers.get("authorization") || "") !== `Bearer ${env.ADMIN_SECRET}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const result = await configureTelegramBot(env, { force: true });
  return json(result, result.ok ? 200 : 502);
}

export async function handleTelegramRepair(env) {
  const result = await configureTelegramBot(env);
  return json(result, result.ok ? 200 : 502);
}
