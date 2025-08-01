require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

const BEARER_TOKEN = decodeURIComponent(process.env.BEARER_TOKEN);
const USERNAME = "DavidDeutschOxf"; // His official Twitter handle

app.get("/tweets", async (req, res) => {
  try {
    // Step 1: Get user ID
    const userRes = await axios.get(
      `https://api.twitter.com/2/users/by/username/${USERNAME}`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    const userId = userRes.data.data.id;

    // Step 2: Get tweets from that user
    const tweetsRes = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        params: {
          max_results: 10,
          "tweet.fields": "id,text,created_at",
        },
      }
    );

    // Step 3: Format and return
    const tweets = tweetsRes.data.data.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      url: `https://twitter.com/${USERNAME}/status/${tweet.id}`,
    }));

    res.json(tweets);
  } catch (err) {
    console.error("Error fetching tweets:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
