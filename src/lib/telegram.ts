/**
 * Kirim satu pesan ke bot Telegram.
 *
 * Kalau `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` kosong, tidak melakukan apa
 * pun — fitur pemanggil tetap jalan tanpa notifikasi.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // URL berisi token, jadi jangan dicetak.
      console.warn("telegram:", res.status, (await res.text()).slice(0, 200));
    }
  } catch (err) {
    console.warn("telegram gagal:", err instanceof Error ? err.name : "unknown");
  }
}
