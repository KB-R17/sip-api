module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const user = (req.query.user || '').toLowerCase().replace('@', '');

    if (!user) {
      res.setHeader('Content-Type', 'text/plain');
      res.send('Usage: !sipreset @username');
      return;
    }

    const key = `sip:${user}`;

    await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/del/${key}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    res.setHeader('Content-Type', 'text/plain');
    res.send(`✅ Sip count for @${user} has been reset to 0!`);

  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};
