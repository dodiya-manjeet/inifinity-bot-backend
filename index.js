require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const BEARER_TOKEN = decodeURIComponent(process.env.BEARER_TOKEN || "");
const USERNAME = "DavidDeutschOxf";

// 🧠 Simple in-memory cache
let cachedTweets = null;
let lastFetched = 0;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

// 🐦 GET /tweets — fetch tweets, cache them, support `?limit=`
app.get("/tweets", async (req, res) => {
  const now = Date.now();
  const limit = parseInt(req.query.limit) || 10;

  // ✅ Serve from cache if fresh
  if (cachedTweets && now - lastFetched < CACHE_DURATION) {
    return res.json(cachedTweets.slice(0, limit));
  }

  try {
    // Step 1: Get user ID from username
    const userRes = await axios.get(
      `https://api.twitter.com/2/users/by/username/${USERNAME}`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    const userId = userRes.data.data.id;

    // Step 2: Fetch tweets
    const tweetsRes = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        params: {
          max_results: 20, // fetch more, filter later
          "tweet.fields": "id,text,created_at",
        },
      }
    );

    const tweets = tweetsRes.data.data.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      url: `https://twitter.com/${USERNAME}/status/${tweet.id}`,
    }));

    // 💾 Cache result
    cachedTweets = tweets;
    lastFetched = now;

    res.json(tweets.slice(0, limit));
  } catch (err) {
    console.error(
      "❌ Error fetching tweets:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

// 🧪 GET /clear-cache — development only
app.get("/clear-cache", (req, res) => {
  cachedTweets = null;
  lastFetched = 0;
  res.send("✅ Tweet cache cleared.");
});

// 🌐 GET / — Health check
app.get("/", (req, res) => {
  res.send("🟢 Infinity Bot API is running.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
