const authData = require('./modules/auth-service.js');
const projectData = require("./modules/projects");
const clientSessions = require('client-sessions');
const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

function ensureLogin(req, res, next) {
  if (!req.session.user) {
      res.redirect("/login");
  } else {
      next();
  }
}

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(clientSessions({
  cookieName: "session", 
  secret: "someSecretKey", 
  duration: 2 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5
}));
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Home page
app.get('/', (req, res) => {
  res.render("home");
});

// About page
app.get('/about', (req, res) => {
  res.render("about");
});

// Projects listing page (with optional sector filtering)
app.get("/solutions/projects", async (req, res) => {
  try {
    if (req.query.sector) {
      let projects = await projectData.getProjectsBySector(req.query.sector);
      (projects.length > 0) ? res.render("projects", {projects: projects}) : res.status(404).render("404", {message: `No projects found for sector: ${req.query.sector}`});
    } else {
      let projects = await projectData.getAllProjects();
      res.render("projects", {projects: projects});
    }
  } catch (err) {
    res.status(404).render("404", {message: err});
  }
});

// Project details page
app.get("/solutions/projects/:id", async (req, res) => {
  try {
    let project = await projectData.getProjectById(req.params.id);
    res.render("project", {project: project});
  } catch (err) {
    res.status(404).render("404", {message: err});
  }
});

// Add a new project (requires login)
app.get("/solutions/addProject", ensureLogin, async (req, res) => {
  let sectors = await projectData.getAllSectors();
  res.render("addProject", { sectors: sectors });
});

// Handle the addition of a new project (requires login)
app.post("/solutions/addProject", ensureLogin, async (req, res) => {
  try {
    await projectData.addProject(req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

// Edit a project (requires login)
app.get("/solutions/editProject/:id", ensureLogin, async (req, res) => {
  try {
    let project = await projectData.getProjectById(req.params.id);
    let sectors = await projectData.getAllSectors();
    res.render("editProject", { project, sectors });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

// Handle the project edit (requires login)
app.post("/solutions/editProject", ensureLogin, async (req, res) => {
  try {
    await projectData.editProject(req.body.id, req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

// Delete a project (requires login)
app.get("/solutions/deleteProject/:id", ensureLogin, async (req, res) => {
  try {
    await projectData.deleteProject(req.params.id);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

// Login route
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: "", userName: "" });
});

// Handle login submission
app.post('/login', async (req, res) => {
  req.body.userAgent = req.get('User-Agent'); // Store user-agent for login history
  try {
    let user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect('/solutions/projects');
  } catch (err) {
    res.render('login', { errorMessage: err, userName: req.body.userName });
  }
});

// Register route
app.get('/register', (req, res) => {
  res.render('register', { errorMessage: "", successMessage: "", userName: "" });
});

// Handle registration submission
app.post('/register', async (req, res) => {
  try {
    await authData.registerUser(req.body);
    res.render('register', {
      errorMessage: "",
      successMessage: "User created",
      userName: ""
    });
  } catch (err) {
    res.render('register', {
      errorMessage: err,
      successMessage: "",
      userName: req.body.userName
    });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

// User history page (requires login)
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});

// 404 error handler
app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

// Initialize the data and start the server
projectData.initialize()
.then(authData.initialize)
.then(function () {
    app.listen(HTTP_PORT, function () {
        console.log(`app listening on: ${HTTP_PORT}`);
    });
})
.catch(function (err) {
    console.log(`Unable to start server: ${err}`);
});
