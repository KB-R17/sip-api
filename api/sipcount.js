module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const user = (req.query.user || 'unknown').toLowerCase();
    const displayUser = req.query.user || 'unknown';
    const key = `sip:${user}`;

    const getRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    const { result: count } = await getRes.json();

    if (!count) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(`@${displayUser} hasn't sipped yet! Type !sip to join the Vanguard Café! ☕🍩`);
      return;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(`☕ @${displayUser} has taken ${count} sip${count == 1 ? '' : 's'} in the Vanguard Café! 🍩`);

  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};
