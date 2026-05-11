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
      50:  `👑☕ 50 SIPS! @${disp
cat > api/siptop.js << 'EOF'
module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const scanRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/scan/0?match=sip:*&count=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    const { result: scanResult } = await scanRes.json();
    const keys = scanResult[1];

    if (!keys || keys.length === 0) {
      res.setHeader('Content-Type', 'text/plain');
      res.send('No sips recorded yet! Type !sip to claim your spot in the Vanguard Café! ☕🍩');
      return;
    }

    const pipeline = keys.map(key => ['get', key]);
    const multiRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pipeline),
      }
    );

    const multiData = await multiRes.json();

    const leaderboard = keys.map((key, i) => ({
      user: key.replace('sip:', ''),
      count: parseInt(multiData[i].result) || 0,
    }));

    leaderboard.sort((a, b) => b.count - a.count);
    const top5 = leaderboard.slice(0, 5);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const message = '☕🍩 Vanguard Café Leaderboard: ' + top5
      .map((entry, i) => `${medals[i]} ${entry.user} (${entry.count} sips)`)
      .join(' | ');

    res.setHeader('Content-Type', 'text/plain');
    res.send(message);

  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};
