module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const user = (req.query.user || 'unknown').toLowerCase();
    const displayUser = req.query.user || 'unknown';
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
      1:   `☕ @${displayUser} just took their FIRST sip in the Vanguard Café! Welcome to the crew! 🍩`,
      5:   `🍵 5 sips deep! @${displayUser} is getting comfortable at the counter! 🍩`,
      10:  `☕🔥 10 sips! @${displayUser} is a regular at Donut_Vanguard's café! The synth is strong with this one!`,
      25:  `🍩💀 25 sips?! @${displayUser} has been riding the synthwave ALL night long!`,
      50:  `👑☕ 50 SIPS! @${displayUser} has unlocked VANGUARD ELITE status! Donuts on the house!`,
      75:  `🌊🍩 75 sips?! @${displayUser} is fully lost in the neon grid — someone send help!`,
      100: `🚨☕ 100 SIPS! @${displayUser} has ASCENDED beyond the synthwave horizon! A legend is born!`,
      200: `🏆🍩 200 SIPS!! @${displayUser} IS the Donut Vanguard. We are not worthy. 👑`,
    };

    const message = milestones[count]
      ?? `☕ @${displayUser} sipped! 🍩 Vanguard sip count: ${count}`;

    res.setHeader('Content-Type', 'text/plain');
    res.send(message);

  } catch (err) {
    console.error('Caught error:', err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
};
