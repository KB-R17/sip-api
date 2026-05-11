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
