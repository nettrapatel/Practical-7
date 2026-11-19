
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "library-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 30
        }
    })
);

// Location of the single HTML file
const htmlFile = path.join(__dirname, "index.html");

// Function to send HTML pages
function sendPage(req, res, showDashboard = false) {
    
     fs.readFile(htmlFile, "utf8", (err, html) => {

        if (err) {
        console.log("File error:", err);
        return res.status(500).send("Unable to load HTML file");
    }

    console.log("HTML file loaded successfully!");

        // Hide protected dashboard HTML from public pages
        if (!showDashboard) {
            html = html.replace(
                /<!-- DASHBOARD_START -->[\s\S]*?<!-- DASHBOARD_END -->/,
                ""
            );
        }

        res.send(html);
    });
}

// Predefined login credentials
const USERNAME = "student";
const PASSWORD = "12345";

// Authentication middleware
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Home route
app.get("/", (req, res) => {
    sendPage(req, res);
});

// About route
app.get("/about", (req, res) => {
    sendPage(req, res);
});

// Login page route
app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }

    sendPage(req, res);
});

// Login form submission
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === USERNAME && password === PASSWORD) {
        req.session.user = username;
        res.redirect("/dashboard");
    } else {
        res.redirect("/login?error=1");
    }
});

// Protected dashboard route
app.get("/dashboard", checkAuth, (req, res) => {
    sendPage(req, res, true);
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Unable to logout");
        }

        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
