const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "attendance.sid",
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

const DEMO_USER = { username: "student", password: "12345", name: "Demo Employee", email: "student@example.com", department: "IT" };

function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f3f6fb;margin:0;color:#172033}
  header{background:#173b68;color:white;padding:18px 7%;display:flex;justify-content:space-between;align-items:center}
  main{max-width:760px;margin:40px auto;padding:28px;background:white;border-radius:12px;box-shadow:0 4px 18px #0001}
  h1{margin-top:0}label{display:block;margin:14px 0 6px}input{width:100%;padding:11px;border:1px solid #ccd3df;border-radius:6px}
  button,.btn{display:inline-block;background:#1769aa;color:white;border:0;padding:11px 17px;border-radius:6px;cursor:pointer;text-decoration:none;margin-top:16px}
  .muted{color:#657187}.error{color:#b42318;background:#fff0ee;padding:10px;border-radius:6px}
  .nav{display:flex;gap:12px;align-items:center}.nav a{color:white}.row{padding:12px 0;border-bottom:1px solid #e7eaf0}
  </style></head><body>${content}</body></html>`;
}
function layout(content) {
  return page("Employee Attendance Portal", `<header><strong>Employee Attendance Portal</strong>
    <nav class="nav"><a href="/dashboard">Dashboard</a><a href="/profile">Profile</a>
    <form method="POST" action="/logout" style="margin:0"><button style="margin:0">Logout</button></form></nav></header>
    <main>${content}</main>`);
}
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}
app.get("/", (req, res) => res.redirect(req.session.user ? "/dashboard" : "/login"));
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.send(page("Login", `<main><h1>Employee Login</h1><p class="muted">Sign in to view your attendance portal.</p>
    ${req.query.error ? '<p class="error">Invalid username or password.</p>' : ""}
    <form method="POST" action="/login"><label>Username</label><input name="username" required autocomplete="username">
    <label>Password</label><input type="password" name="password" required autocomplete="current-password">
    <button type="submit">Login</button></form><p class="muted">Demo: student / 12345</p></main>`));
});
app.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  if (username !== DEMO_USER.username || password !== DEMO_USER.password) return res.redirect("/login?error=1");
  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.user = { username: DEMO_USER.username, name: DEMO_USER.name, email: DEMO_USER.email, department: DEMO_USER.department };
    res.redirect("/dashboard");
  });
});
app.get("/dashboard", requireLogin, (req, res) => {
  res.send(layout(`<h1>Dashboard</h1><p>Welcome, <strong>${req.session.user.name}</strong>.</p>
    <div class="row"><strong>Today's attendance:</strong> Present</div>
    <div class="row"><strong>Employee ID:</strong> EMP001</div>
    <div class="row"><strong>Department:</strong> ${req.session.user.department}</div>
    <p class="muted">This is sample attendance data for the practical demonstration.</p>`));
});
app.get("/profile", requireLogin, (req, res) => {
  const u = req.session.user;
  res.send(layout(`<h1>My Profile</h1><div class="row"><strong>Name:</strong> ${u.name}</div>
    <div class="row"><strong>Username:</strong> ${u.username}</div><div class="row"><strong>Email:</strong> ${u.email}</div>
    <div class="row"><strong>Department:</strong> ${u.department}</div>`));
});
app.post("/logout", requireLogin, (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie("attendance.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.redirect("/login");
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong. Check the server terminal.");
});
app.listen(PORT, () => console.log(`Employee Attendance Portal running at http://localhost:${PORT}`));