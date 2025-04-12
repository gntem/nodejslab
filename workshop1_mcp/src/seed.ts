import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("infrastructure/main.db");

db.exec(`
  DROP TABLE IF EXISTS scores;
  DROP TABLE IF EXISTS leaderboards;
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboards (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY,
    leaderboard_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id)
  );
`);

const seedData = [
  { name: "A", leaderboard_id: 1, score: 100 },
  { name: "B", leaderboard_id: 1, score: 200 },
  { name: "C", leaderboard_id: 1, score: 300 },
  { name: "D", leaderboard_id: 1, score: 400 },
  { name: "E", leaderboard_id: 2, score: 500 },
  { name: "F", leaderboard_id: 2, score: 600 },
  { name: "G", leaderboard_id: 2, score: 700 },
  { name: "H", leaderboard_id: 2, score: 800 },
];

db.exec("DELETE FROM leaderboards");
db.exec("DELETE FROM scores");

db.prepare("INSERT INTO leaderboards (id, name) VALUES (?, ?)").run(
  1,
  "Tournament A",
);
db.prepare("INSERT INTO leaderboards (id, name) VALUES (?, ?)").run(
  2,
  "Tournament B",
);

seedData.forEach(({ name, leaderboard_id, score }) => {
  db.prepare(
    "INSERT INTO scores (name, leaderboard_id, score) VALUES (?, ?, ?)",
  ).run(name, leaderboard_id, score);
});

const selectAll = db.prepare("SELECT * FROM scores;");
const rows = selectAll.all();

rows.forEach((row) => {
  console.log(JSON.stringify(row));
});
