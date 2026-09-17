// netlify/functions/notify.js
//
// এই ফাংশনটি ফর্ম থেকে আসা তথ্য নিয়ে আপনার Telegram বটে পাঠায়।
// এই ফাইলটি সার্ভার সাইডে চলে — ওয়েবসাইট ভিজিটররা "View Page Source" করলেও
// এই কোড বা টোকেন দেখতে পাবে না। শুধু GitHub রিপোটা Private রাখবেন,
// কারণ রিপো Public হলে GitHub-এ ব্রাউজ করে যে কেউ এই ফাইলটা দেখে ফেলতে পারবে।
//
// চাইলে ভবিষ্যতে Netlify Environment Variable দিয়েও ওভাররাইড করা যাবে,
// কিন্তু এখন কিছু সেট না করলেও নিচের হার্ডকোড করা ভ্যালু দিয়েই কাজ করবে।

const DEFAULT_BOT_TOKEN = "8712531638:AAGKAWT_VLdJBiCTs-KPx0t2WrhUlYpiaU4";
const DEFAULT_CHAT_ID = "7761925226";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server not configured: missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID" }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { customerName, customerPhone, paymentMethod, transactionId, whatsappNumber } = data;

  // Basic validation
  if (!customerName || !customerPhone || !paymentMethod || !transactionId || !whatsappNumber) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
  }

  const text =
    `🆕 *নতুন পেমেন্ট এসেছে — Tanjib BD*\n\n` +
    `👤 নাম: ${escapeMd(customerName)}\n` +
    `📱 মোবাইল: ${escapeMd(customerPhone)}\n` +
    `💳 মাধ্যম: ${escapeMd(paymentMethod)}\n` +
    `🧾 Transaction ID: ${escapeMd(transactionId)}\n` +
    `💬 WhatsApp: ${escapeMd(whatsappNumber)}\n\n` +
    `✅ যাচাই করে গ্রুপে যুক্ত করুন।`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return { statusCode: 502, body: JSON.stringify({ error: "Telegram send failed" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};

function escapeMd(str) {
  return String(str).replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
