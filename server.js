const express = require("express");
const cors = require("cors");
const color = require("colors");
const i18n = require("i18n");

const app = express();

app.use(cors());

i18n.configure({
  locales: ["en", "fr"],
  directory: __dirname + "/locales",
  defaultLocale: "en",
  queryParameter: "lang",
  cookie: "lang",
  autoReload: true,
  syncFiles: true,
});

app.use(i18n.init);

app.use((req, res, next) => {
  const lang = req.headers["accept-language"] || "en";
  i18n.setLocale(lang); 
  next(); 
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// database
const db = require("./app/models");
const Role = db.role;

// db.sequelize.sync();
db.sequelize.sync().then(() => {
  console.log("Database synchronized successfully.".green);
  initial();
});

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Brazalink application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/business.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/feedbacks.routes")(app);

// set port, listen for requests
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`.rainbow);
});

async function initial() {
  const count = await Role.count();
  if (count === 0) {
    await Role.create({ id: 1, name: "user" });
    await Role.create({ id: 2, name: "moderator" });
    await Role.create({ id: 3, name: "admin" });
    console.log("Roles initialized successfully.".blue);
  } else {
    console.log("Roles already initialized.".yellow);
  }
}
