const express = require("express");
const router = express.Router();
const { getDb, save } = require("../db/mydb");

async function getVenues() {
  const db = await getDb();
  const results = db.exec("SELECT * FROM Venue ORDER BY name");
  return results.length > 0 ? results[0].values.map(row => ({
    venue_id: row[0], name: row[1], city: row[2], state: row[3]
  })) : [];
}

router.get("/", async (req, res) => {
  const db = await getDb();
  const results = db.exec(`
    SELECT Show.show_id, Show.date, Show.ticketPrice, Show.genre, Show.venue_id, Venue.name AS venue_name
    FROM Show
    JOIN Venue ON Show.venue_id = Venue.venue_id
    ORDER BY Show.date DESC
  `);
  const shows = results.length > 0 ? results[0].values.map(row => ({
    show_id: row[0], date: row[1], ticketPrice: row[2], genre: row[3], venue_id: row[4], venue_name: row[5]
  })) : [];
  res.render("shows", { shows });
});

router.get("/new", async (req, res) => {
  const venues = await getVenues();
  res.render("showForm", { venues });
});

router.post("/", async (req, res) => {
  const { date, ticketPrice, genre, venue_id } = req.body;
  const db = await getDb();
  db.run(
    "INSERT INTO Show (date, ticketPrice, genre, venue_id) VALUES (?, ?, ?, ?)",
    [date, ticketPrice || null, genre || null, venue_id]
  );
  save();
  res.redirect("/shows");
});

router.get("/:id/edit", async (req, res) => {
  const db = await getDb();
  const results = db.exec("SELECT * FROM Show WHERE show_id = ?", [req.params.id]);
  if (results.length === 0) return res.status(404).send("Show not found");
  const row = results[0].values[0];
  const show = { show_id: row[0], date: row[1], ticketPrice: row[2], genre: row[3], venue_id: row[4] };
  const venues = await getVenues();
  res.render("showEdit", { show, venues });
});

router.post("/:id/edit", async (req, res) => {
  const { date, ticketPrice, genre, venue_id } = req.body;
  const db = await getDb();
  db.run(
    "UPDATE Show SET date = ?, ticketPrice = ?, genre = ?, venue_id = ? WHERE show_id = ?",
    [date, ticketPrice || null, genre || null, venue_id, req.params.id]
  );
  save();
  res.redirect("/shows");
});

router.post("/:id/delete", async (req, res) => {
  const db = await getDb();
  db.run("DELETE FROM Show WHERE show_id = ?", [req.params.id]);
  save();
  res.redirect("/shows");
});

module.exports = router;