export default async function handler(req, res) {
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
    res.status(500).send('Error tracking sip. Try again!');
    return;
  }

  const { result: count } = await incrRes.json();

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
}
