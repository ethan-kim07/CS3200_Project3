const express = require("express");
const path = require("path");
const Redis = require("ioredis");

// Existing route files (from previous ShowTracker project)
const showsRouter = require("./routes/shows");
const venuesRouter = require("./routes/venues");

// New Redis route files
const trendingRouter = require("./routes/trending");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Redis connection ──
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis error:", err.message));

// Make redis client available to all routes via app.locals
app.locals.redis = redis;

// ── Middleware ──
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Routes ──

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Existing ShowTracker routes (SQLite)
app.use("/shows", showsRouter);
app.use("/venues", venuesRouter);

// New Redis routes
app.use("/trending", trendingRouter);

// ── Seed Redis with sample data ──
app.post("/seed", async (req, res) => {
  try {
    await redis.flushall();

    // Seed trending venues (sorted set)
    // Using venue_ids that could exist in SQLite
    await redis.zadd("trendingVenues", 47, "2");
    await redis.zadd("trendingVenues", 31, "5");
    await redis.zadd("trendingVenues", 22, "8");
    await redis.zadd("trendingVenues", 15, "3");
    await redis.zadd("trendingVenues", 8, "11");

    // Seed show activity feed (list)
    const activities = [
      { showId: 1, action: "created", venue: "IT WORKS", genre: "rock", ts: Date.now() },
      { showId: 2, action: "viewed", venue: "The Fillmore", genre: "indie", ts: Date.now() - 60000 },
      { showId: 3, action: "edited", venue: "Madison Square Garden", genre: "pop", ts: Date.now() - 120000 },
      { showId: 4, action: "viewed", venue: "Red Rocks", genre: "electronic", ts: Date.now() - 180000 },
    ];
    for (const a of activities) {
      await redis.lpush("showActivityFeed", JSON.stringify(a));
    }
    await redis.ltrim("showActivityFeed", 0, 49);

    res.redirect("/?seeded=true");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error seeding data: " + err.message);
  }
});

// ── Flush all Redis data ──
app.post("/flush", async (req, res) => {
  try {
    await redis.flushall();
    res.redirect("/?flushed=true");
  } catch (err) {
    res.status(500).send("Error flushing: " + err.message);
  }
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`ShowTracker running on http://localhost:${PORT}`);
});
