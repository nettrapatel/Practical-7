
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "course-secret",
    resave: false,
    saveUninitialized: false
}));

const file = path.join(__dirname, "index.html");

const USERNAME = "student";
const PASSWORD = "12345";

function page(section, res, error = "") {
    fs.readFile(file, "utf8", (err, html) => {
        if (err) return res.status(500).send("File not found");

        const start = `<!-- ${section}_START -->`;
        const end = `<!-- ${section}_END -->`;

        const a = html.indexOf(start);
        const b = html.indexOf(end);

        if (a === -1 || b === -1) {
            return res.status(500).send("Section not found");
        }

        let content = html.substring(a + start.length, b);
        content = content.replace("{{ERROR}}", error);

        const header = html.substring(0, html.indexOf("<!-- PAGES_START -->"));
        const marker = "<!-- FOOTER_START -->";

         const footer = html.substring(
             html.indexOf(marker) + marker.length,
             html.indexOf("<!-- FOOTER_END -->")
        );

        res.send(header + content + footer + "</body></html>");
    });
}

function auth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
}

app.get("/", (req, res) => page("HOME", res));

app.get("/login", (req, res) => {
    if (req.session.user) return res.redirect("/courses");

    page("LOGIN", res,
        req.query.error ? "Invalid login details!" : "");
});

app.post("/login", (req, res) => {
    if (
        req.body.username === USERNAME &&
        req.body.password === PASSWORD
    ) {
        req.session.user = req.body.username;
        res.redirect("/courses");
    } else {
        res.redirect("/login?error=1");
    }
});

app.get("/courses", auth, (req, res) => {
    page("COURSES", res);
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

app.listen(3000, () => {
    console.log("Online Course Portal running at http://localhost:3000");
});
