const { nanoid } = require("nanoid");
const Url = require("../models/urlModels");
const NodeCache = require("node-cache");
const rateLimit = require("express-rate-limit");


const cache = new NodeCache({ stdTTL: 600 });

// Rate limit middleware
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, 
  message: "Rate limit exceeded",
});

const generateUrl = async (req, res) => {
  const { originUrl } = req.body;
  const base = process.env.BASE;


  const cachedUrl = cache.get(originUrl);
  if (cachedUrl) {
    return res.json(cachedUrl);
  }

  const urlId = nanoid(5);

  try {
    let url = await Url.findOne({ originUrl });
    if (url) {
      cache.set(originUrl, url)
      res.json(url);
     }
    else {
      const shortUrl = `${base}/${urlId}`;
      url = new Url({
        originUrl,
        shortUrl,
        urlId,
        date: new Date(),
      });
      await url.save();
      
      cache.set(originUrl, url);
      res.json(url);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Server Error");
  }
};

module.exports = { generateUrl, limiter };
