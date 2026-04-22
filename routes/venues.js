const express = require("express");
const router = express.Router();
const { getDb, save } = require("../db/mydb");

// READ - List all venues
router.get("/", async (req, res) => {
  const db = await getDb();
  const results = db.exec("SELECT * FROM Venue ORDER BY name");
  const venues = results.length > 0 ? results[0].values.map(row => ({
    venue_id: row[0], name: row[1], city: row[2], state: row[3], capacity: row[4], genreTags: row[5]
  })) : [];
  res.render("venues", { venues });
});

// CREATE - Show form
router.get("/new", (req, res) => {
  res.render("venueForm");
});

// CREATE - Handle form submission
router.post("/", async (req, res) => {
  const { name, city, state, capacity, genreTags } = req.body;
  const db = await getDb();
  db.run(
    "INSERT INTO Venue (name, city, state, capacity, genreTags) VALUES (?, ?, ?, ?, ?)",
    [name, city, state, capacity || null, genreTags || null]
  );
  save();
  res.redirect("/venues");
});

// UPDATE - Show edit form
router.get("/:id/edit", async (req, res) => {
  const db = await getDb();
  const results = db.exec("SELECT * FROM Venue WHERE venue_id = ?", [req.params.id]);
  if (results.length === 0) return res.status(404).send("Venue not found");
  const row = results[0].values[0];
  const venue = { venue_id: row[0], name: row[1], city: row[2], state: row[3], capacity: row[4], genreTags: row[5] };
  res.render("venueEdit", { venue });
});

// UPDATE - Handle edit submission
router.post("/:id/edit", async (req, res) => {
  const { name, city, state, capacity, genreTags } = req.body;
  const db = await getDb();
  db.run(
    "UPDATE Venue SET name = ?, city = ?, state = ?, capacity = ?, genreTags = ? WHERE venue_id = ?",
    [name, city, state, capacity || null, genreTags || null, req.params.id]
  );
  save();
  res.redirect("/venues");
});

// DELETE - Handle deletion
router.post("/:id/delete", async (req, res) => {
  const db = await getDb();
  db.run("DELETE FROM Venue WHERE venue_id = ?", [req.params.id]);
  save();
  res.redirect("/venues");
});

module.exports = router;