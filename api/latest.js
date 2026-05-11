module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const getRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/latest_sip_event`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    const { result } = await getRes.json();
    if (!result) {
      res.status(200).json({});
      return;
    }

    res.status(200).json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
