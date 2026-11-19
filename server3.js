const express = require("express");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "hotel.sid",
  secret: process.env.SESSION_SECRET || "replace-this-secret-for-class-project",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60 * 1000
  }
}));

const DEMO_USER = { username: "guest", password: "12345", name: "Demo Guest" };
// Demo-only storage: reservations disappear when the server restarts.
const reservations = [];

function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f4f6f8;margin:0;color:#172033}
  header{background:#174b43;color:white;padding:18px 7%;display:flex;justify-content:space-between;align-items:center}
  main{max-width:760px;margin:40px auto;padding:28px;background:white;border-radius:12px;box-shadow:0 4px 18px #0001}
  h1{margin-top:0}label{display:block;margin:14px 0 6px}input,select{width:100%;padding:11px;border:1px solid #ccd3df;border-radius:6px}
  button,.btn{display:inline-block;background:#147d64;color:white;border:0;padding:11px 17px;border-radius:6px;cursor:pointer;text-decoration:none;margin-top:16px}
  .muted{color:#657187}.error{color:#b42318;background:#fff0ee;padding:10px;border-radius:6px}
  .nav{display:flex;gap:12px;align-items:center}.nav a{color:white}.item{padding:14px 0;border-bottom:1px solid #e7eaf0}
  </style></head><body>${content}</body></html>`;
}
function layout(content) {
  return page("Hotel Reservation Portal", `<header><strong>Hotel Reservation Portal</strong><nav class="nav">
    <a href="/booking">Booking</a><form method="POST" action="/logout" style="margin:0">
    <button style="margin:0">Logout</button></form></nav></header><main>${content}</main>`);
}
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}
app.get("/", (req, res) => res.redirect(req.session.user ? "/booking" : "/login"));
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/booking");
  res.send(page("Guest Login", `<main><h1>Guest Login</h1><p class="muted">Login to access the protected booking page.</p>
    ${req.query.error ? '<p class="error">Invalid username or password.</p>' : ""}
    <form method="POST" action="/login"><label>Username</label><input name="username" required autocomplete="username">
    <label>Password</label><input type="password" name="password" required autocomplete="current-password">
    <button type="submit">Login</button></form><p class="muted">Demo: guest / 12345</p></main>`));
});
app.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  if (username !== DEMO_USER.username || password !== DEMO_USER.password) return res.redirect("/login?error=1");
  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.user = { username: DEMO_USER.username, name: DEMO_USER.name };
    res.redirect("/booking");
  });
});
app.get("/booking", requireLogin, (req, res) => {
  const mine = reservations.filter(r => r.username === req.session.user.username);
  const reservationHtml = mine.length
    ? mine.map(r => `<div class="item"><strong>${r.hotel}</strong> — ${r.date} — ${r.nights} night(s), ${r.guests} guest(s)</div>`).join("")
    : '<p class="muted">You have no reservations yet.</p>';
  res.send(layout(`<h1>Room Booking</h1><p>Welcome, ${req.session.user.name}. This page is protected by session login.</p>
    <form method="POST" action="/booking"><label>Hotel</label><select name="hotel" required>
    <option value="Grand Palace Hotel">Grand Palace Hotel</option><option value="City View Hotel">City View Hotel</option>
    <option value="Ocean Breeze Hotel">Ocean Breeze Hotel</option></select>
    <label>Check-in date</label><input type="date" name="date" required>
    <label>Number of nights</label><input type="number" name="nights" min="1" max="30" value="1" required>
    <label>Number of guests</label><input type="number" name="guests" min="1" max="8" value="1" required>
    <button type="submit">Confirm Booking</button></form><h2>Your Reservations</h2>${reservationHtml}`));
});
app.post("/booking", requireLogin, (req, res) => {
  const { hotel, date, nights, guests } = req.body;
  const validHotels = ["Grand Palace Hotel", "City View Hotel", "Ocean Breeze Hotel"];
  const nightCount = Number(nights), guestCount = Number(guests);
  if (!validHotels.includes(hotel) || !date || !Number.isInteger(nightCount) || nightCount < 1 || nightCount > 30 ||
      !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 8) {
    return res.status(400).send(layout('<h1>Invalid booking details</h1><a href="/booking">Go back</a>'));
  }
  reservations.push({ username: req.session.user.username, hotel, date, nights: nightCount, guests: guestCount });
  res.redirect("/booking");
});
app.post("/logout", requireLogin, (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie("hotel.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.redirect("/login");
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong. Check the server terminal.")
});
app.listen(PORT, () => {
    console.log(`Hotel Reservation Portal running at http://localhost:${PORT}`);
});