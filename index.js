import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import "dotenv/config";

const app = express();
const port = 3000;
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }))


const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

db.connect();

let currentUserId = 1;

async function getCountries() {
    const result = await db.query(" SELECT visited_countries.country_code , countries.country_name,users.color  FROM visited_countries JOIN countries  ON visited_countries.country_code = countries.country_code JOIN users ON visited_countries.user_id = users.id WHERE visited_countries.user_id = $1", [currentUserId]);

    return result.rows;
}
async function getUser() {
    const result = await db.query("SELECT * FROM users");
    return result.rows;
}
async function getuser() {
    const result = await db.query("SELECT * FROM users WHERE id = $1 ", [currentUserId])
    return result.rows
}
app.get("/", async (req, res) => {
    const contries = await getCountries()
    const user = await getUser();
    const person = await getuser();
    const error = req.query.error
    const message = req.query.mess
    console.log(person)
    res.render("index.ejs", {
        countries: contries,
        users: user,
        userss: person,
        error: error,
        message: message
    });
});

app.post("/user", (req, res) => {
    const result = req.body.user;
    currentUserId = result;

    res.redirect("/")
})


app.post("/add", async (req, res) => {
    const country_name = req.body.country;
    const result = await db.query("SELECT * FROM countries WHERE LOWER(country_name) = LOWER($1)", [country_name]);

    if (result.rows.length > 0) {
        const code = result.rows[0].country_code;
        const country_check = await db.query("SELECT * FROM visited_countries WHERE user_id = $1 AND country_code = $2 ", [currentUserId, code])
        const country_checking = country_check.rows;
        if (country_checking.length === 0) {
            await db.query("INSERT INTO visited_countries (country_code,user_id) VALUES($1,$2)", [code, currentUserId]);
            res.redirect("/")
        } else {
            const mess = "the country is already added";
            res.redirect("/?mess=" + encodeURIComponent(mess));
        }

    }
    else {
        const error = "country not existed or please enter valid country name";
        res.redirect("/?error=" + encodeURIComponent(error));
    }

});


app.post("/new_user", async (req, res) => {
    const user = req.body.new_user;
    const color = req.body.user_color;
    if (color && user) {
        await db.query("INSERT INTO users(name,color) VALUES($1,$2)", [user, color])

    }
    res.redirect("/");

});

app.post("/delete", async (req, res) => {
    const user_del = req.body.user;

    await db.query(
        "DELETE FROM visited_countries WHERE user_id = $1",
        [user_del]
    );

    await db.query(
        "DELETE FROM users WHERE id = $1",
        [user_del]
    );

    res.redirect("/");
});
app.post("/delete_con", async (req, res) => {

    const country_code = req.body.country;

    await db.query(
        "DELETE FROM visited_countries WHERE user_id = $1 AND country_code = $2",
        [currentUserId, country_code]
    );

    res.redirect("/");
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

