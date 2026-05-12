module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const user = (req.query.user || 'unknown').toLowerCase();
    const displayUser = req.query.user || 'unknown';

    // Today's date in Central Time
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const dayKey = `sipday:${user}:${today}`;

    // Try to claim today's sip — only succeeds if not already claimed
    const setRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['SET', dayKey, '1', 'NX', 'EX', 172800]
        ]),
      }
    );

    const setData = await setRes.json();
    const didClockIn = setData[0].result === 'OK';

    // Already clocked in today
    if (!didClockIn) {
      const alreadyMessages = [
        `☕ @${displayUser}, you already clocked in at the Vanguard Café today! Come back tomorrow! 🍩`,
        `🍩 Easy there @${displayUser}! One sip per day keeps the donuts on display! See you tomorrow! ☕`,
        `🚫 @${displayUser}, the Café only serves one sip per Vanguard per day. Tomorrow's brew awaits! ☕🍩`,
        `⏰ @${displayUser}, your shift's already started! The next sip is on tomorrow's menu ☕🍩`,
      ];
      const msg = alreadyMessages[Math.floor(Math.random() * alreadyMessages.length)];
      res.setHeader('Content-Type', 'text/plain');
      res.send(msg);
      return;
    }

    // First sip today — increment lifetime count
    const key = `sip:${user}`;
    const incrRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/incr/${key}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    if (!incrRes.ok) {
      const errorText = await incrRes.text();
      res.status(500).send(`Upstash error: ${errorText}`);
      return;
    }

    const { result: count } = await incrRes.json();

    const milestones = {
      1:   `☕ @${displayUser} just clocked in for their FIRST sip at the Vanguard Café! Welcome to the crew! 🍩`,
      5:   `🍵 5 sips clocked in! @${displayUser} is getting comfortable at the counter! 🍩`,
      10:  `☕🔥 10 sips! @${displayUser} is a regular at Donut_Vanguard's café! The synth is strong with this one!`,
      25:  `🍩💀 25 sips?! @${displayUser} has been riding the synthwave for weeks!`,
      50:  `👑☕ 50 SIPS! @${displayUser} has unlocked VANGUARD ELITE status! Donuts on the house!`,
      75:  `🌊🍩 75 sips?! @${displayUser} is fully lost in the neon grid!`,
      100: `🚨☕ 100 SIPS! @${displayUser} has ASCENDED beyond the synthwave horizon! A legend is born!`,
      200: `🏆🍩 200 SIPS!! @${displayUser} IS the Donut Vanguard. We are not worthy. 👑`,
    };

    const message = milestones[count]
      ?? `☕ @${displayUser} clocked in! 🍩 Total Vanguard sips: ${count}`;

    // Save latest event for overlay
    await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['SET', 'latest_sip_event', JSON.stringify({ user: displayUser, count, message }), 'EX', 30]
        ]),
      }
    );

    res.setHeader('Content-Type', 'text/plain');
    res.send(message);

  } catch (err) {
    console.error('Caught error:', err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
};
