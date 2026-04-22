const express = require("express");
const router = express.Router();
const { getDb } = require("../db/mydb");

// Helper: look up venue names from SQLite for display
async function getVenueNames(venueIds) {
  const db = await getDb();
  const names = {};
  for (const id of venueIds) {
    const results = db.exec("SELECT name, city, state FROM Venue WHERE venue_id = ?", [id]);
    if (results.length > 0 && results[0].values.length > 0) {
      const row = results[0].values[0];
      names[id] = `${row[0]} (${row[1]}, ${row[2]})`;
    } else {
      names[id] = `Venue #${id}`;
    }
  }
  return names;
}

// Helper: get all venues for the dropdown
async function getAllVenues() {
  const db = await getDb();
  const results = db.exec("SELECT venue_id, name, city, state FROM Venue ORDER BY name");
  return results.length > 0
    ? results[0].values.map((row) => ({
        venue_id: row[0],
        name: row[1],
        city: row[2],
        state: row[3],
      }))
    : [];
}

// ── READ: Show trending venues leaderboard ──
// Redis commands: ZREVRANGE (ranked retrieval), ZCARD (count)
router.get("/", async (req, res) => {
  const redis = req.app.locals.redis;

  try {
    // ZREVRANGE returns members from highest to lowest score
    const results = await redis.zrevrange("trendingVenues", 0, -1, "WITHSCORES");

    // ioredis returns flat array: [member, score, member, score, ...]
    const venueIds = [];
    const entries = [];
    for (let i = 0; i < results.length; i += 2) {
      venueIds.push(results[i]);
      entries.push({
        venueId: results[i],
        views: parseInt(results[i + 1], 10),
      });
    }

    // Look up venue names from SQLite
    const venueNames = await getVenueNames(venueIds);
    entries.forEach((e) => (e.venueName = venueNames[e.venueId] || `Venue #${e.venueId}`));

    // ZCARD returns total number of members in the sorted set
    const totalCount = await redis.zcard("trendingVenues");

    // Get all venues for the "record a view" dropdown
    const allVenues = await getAllVenues();

    res.render("trending", { entries, totalCount, allVenues });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading trending venues: " + err.message);
  }
});

// ── CREATE / UPDATE: Record a venue view ──
// Redis command: ZINCRBY (increment score; creates member if not present)
router.post("/view", async (req, res) => {
  const redis = req.app.locals.redis;
  const { venueId } = req.body;

  try {
    // ZINCRBY increments the score of a member by the given amount
    // If the member doesn't exist, it is added with the increment as its score
    await redis.zincrby("trendingVenues", 1, venueId);
    res.redirect("/trending");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error recording view: " + err.message);
  }
});

// ── UPDATE: Set an exact score for a venue ──
// Redis command: ZADD (sets score directly, overwrites if exists)
router.post("/set-score", async (req, res) => {
  const redis = req.app.locals.redis;
  const { venueId, score } = req.body;

  try {
    // ZADD sets the score for a member; overwrites existing score
    await redis.zadd("trendingVenues", parseInt(score, 10), venueId);
    res.redirect("/trending");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting score: " + err.message);
  }
});

// ── DELETE: Remove a specific venue from the sorted set ──
// Redis command: ZREM (removes one or more members)
router.post("/remove", async (req, res) => {
  const redis = req.app.locals.redis;
  const { venueId } = req.body;

  try {
    // ZREM removes the specified member from the sorted set
    await redis.zrem("trendingVenues", venueId);
    res.redirect("/trending");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error removing venue: " + err.message);
  }
});

// ── DELETE: Clear entire trending leaderboard ──
// Redis command: DEL (removes the entire key)
router.post("/clear", async (req, res) => {
  const redis = req.app.locals.redis;

  try {
    // DEL removes the key and all its data from Redis
    await redis.del("trendingVenues");
    res.redirect("/trending");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error clearing leaderboard: " + err.message);
  }
});

module.exports = router;
