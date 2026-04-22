# CS3200_Project3

# ShowTracker — Redis Practicum

CS 3200 Database Design | Spring 2026 | Northeastern University

## Video Walkthrough
Please download if you can't hear audio
> [Video Link]


## Description

ShowTracker is a concert/event tracking application that manages **shows** and **venues** using a SQLite database with a Node.js + Express + EJS stack. This practicum extends ShowTracker with a **Redis in-memory layer** using a sorted set to track trending venues:

| Feature | Redis Structure | Key | Purpose |
|---|---|---|---|
| **Trending Venues** | Sorted Set | `trendingVenues` | Tracks venue page view counts with ranked leaderboard retrieval |

## Conceptual Model

![UML Conceptual Model](./uml_conceptual_model.png)

The full conceptual model includes Venue, Show, Artist, Song, Setlist, User, and Attendance. The current implementation covers Venue and Show in SQLite. The Redis layer adds a sorted set for tracking trending venues, tied to the Venue entity. This conceptual model is reused from project 1.

## Existing Schema (SQLite)

**Venue** — `venue_id` (PK), `name`, `city`, `state`, `capacity`, `genreTags`

**Show** — `show_id` (PK), `date`, `ticketPrice`, `genre`, `venue_id` (FK → Venue)

## Redis CRUD Summary

| Operation | Sorted Set (Trending Venues) |
|---|---|
| **Create** | `ZINCRBY` / `ZADD` |
| **Read** | `ZREVRANGE`, `ZSCORE`, `ZCARD` |
| **Update** | `ZINCRBY` / `ZADD` (overwrite) |
| **Delete** | `ZREM` / `DEL` |

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **View Engine:** EJS
- **Primary Database:** SQLite (via sql.js)
- **In-Memory Store:** Redis (Docker)
- **Redis Client:** ioredis

## Getting Started

### Prerequisites

- Node.js v18+
- Docker

### 1. Clone the repo

```bash
git clone https://github.com/<ethan-kim07>/CS3200_Project3.git
cd CS3200_Project3
```

### 2. Start Redis with Docker

```bash
docker run -d --name redis-showtracker -p 6379:6379 redis:latest
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app

```bash
npm start
```

Open **http://localhost:3000** in your browser.

### 5. Seed sample data

Click **Seed Sample Data** on the home page to populate Redis with example trending venue data.

## Project Structure

```
CS3200_Project3/
├── app.js                    # Express entry point, Redis connection
├── package.json
├── db/
│   ├── mydb.js               # SQLite connection (sql.js)
│   └── showtracker.db        # SQLite database file
├── routes/
│   ├── shows.js              # Show CRUD routes (SQLite)
│   ├── venues.js             # Venue CRUD routes (SQLite)
│   └── trending.js           # Trending venues (Redis sorted set)
├── views/
│   ├── partials/
│   │   └── header.ejs
│   ├── index.ejs
│   ├── shows.ejs
│   ├── showForm.ejs
│   ├── showEdit.ejs
│   ├── venues.ejs
│   ├── venueForm.ejs
│   ├── venueEdit.ejs
│   └── trending.ejs          # Redis sorted set UI
├── uml_conceptual_model.png
├── requirments.pdf
├── .gitignore
└── README.md
```

## Requirements Document

See [requirments.pdf](./requirments.pdf) for the full specification including problem requirements, conceptual model, Redis data structure design, and CRUD command documentation.

## AI Disclosure

Portions of this project were developed with assistance from Claude (Anthropic). Specifically:
- Requirements PDF format help
- Redis route boilerplate
- EJS template for the trending venues page
