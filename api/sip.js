module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const user = (req.query.user || 'unknown').toLowerCase();
    const displayUser = req.query.user || 'unknown';
    const key = `sip:${user}`;

    console.log('URL:', process.env.UPSTASH_REDIS_REST_URL);
    console.log('Token exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);
    console.log('Key:', key);

    const incrRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/incr/${key}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    console.log('Upstash status:', incrRes.status);

    if (!incrRes.ok) {
      const errorText = await incrRes.text();
      console.log('Upstash error:', errorText);
      res.status(500).send(`Upstash error: ${errorText}`);
      return;
    }

    const { result: count } = await incrRes.json();
    console.log('Count:', count);

    const milestones = {
      1:   `🎉 @${displayUser} took their FIRST sip! The journey begins!`,
      5:   `🥤 @${displayUser} is warming up — 5 sips in!`,
      10:  `🔥 10 sips for @${displayUser}! Getting dangerous in here!`,
      25:  `💀 25 sips! Someone check on @${displayUser}...`,
      50:  `👑 50 SIPS! @${displayUser} is an absolute legend!`,
      75:  `😵 75 sips?! @${displayUser} are you okay?!`,
      100: `🚨 100 SIPS! @${displayUser} has ascended. We are not worthy.`,
      200: `🏆 200 sips!! @${displayUser} is the undisputed Sip Champion!`,
    };

    const message = milestones[count]
      ?? `@${displayUser} sipped! 🥤 Personal total: ${count} sips`;

    res.setHeader('Content-Type', 'text/plain');
    res.send(message);

  } catch (err) {
    console.error('Caught error:', err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
};
