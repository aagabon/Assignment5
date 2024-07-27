/*********************************************************************************
*  WEB700 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Alexa Agabon  Student ID: 151904232 Date: July 26, 2024
*
*  Online (vercel) Link: ________________________________________________________
*
********************************************************************************/ 


const express = require('express');
const exphbs = require('express-handlebars');
const fs = require('fs');
const path = require('path');
const app = express();
const { initialize, getStudentByNum, getCourses, getAllStudents, getStudentsByCourse, getCourseById, updateStudent } = require('./collegeData');

// Set up Handlebars with custom helpers
const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') +
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Middleware to set the active route
app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve addStudent.html
app.get('/students/add', (req, res) => {
    res.render('addStudent');
});

// Add the express.urlencoded middleware
app.use(express.urlencoded({ extended: true }));

// Route to handle adding a new student
app.post('/students/add', async (req, res) => {
    try {
        await addStudent(req.body); // Assuming addStudent handles adding a student to data
        res.redirect('/students'); // Redirect to list of students after adding
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).send('Error adding student');
    }
});

// Route to render the home view
app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

// Route to render the about view
app.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

// Route to render the htmlDemo view
app.get('/htmlDemo', (req, res) => {
    res.render('htmlDemo', { title: 'HTML Demo' });
});

// Route to render the students view
app.get('/students', async (req, res) => {
    try {
        let students;
        if (req.query.course) {
            const course = parseInt(req.query.course);
            if (isNaN(course) || course < 1 || course > 7) {
                return res.render('students', { message: "Invalid course number. Must be between 1 and 7." });
            }
            students = await getStudentsByCourse(course);
        } else {
            students = await getAllStudents();
        }

        if (students.length === 0) {
            res.render('students', { message: "no results" });
        } else {
            res.render('students', { students: students });
        }
    } catch (error) {
        console.error(error);
        res.render('students', { message: "Internal server error" });
    }
});

// Route to render a single student's details view
app.get("/student/:studentNum", (req, res) => {
    const studentNum = req.params.studentNum;
    Promise.all([
        getStudentByNum(studentNum),
        getCourses()
    ])
        .then(([student, courses]) => {
            res.render("student", { student, courses });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Unable to retrieve student data");
        });
});



// Route to render the courses view
app.get('/courses', async (req, res) => {
    try {
        const courses = await getCourses();
        res.render('courses', { courses: courses });
    } catch (error) {
        console.error(error);
        res.render('courses', { message: 'No results' });
    }
});

// Route to render a single course details view
app.get('/course/:id', (req, res) => {
    const courseId = Number(req.params.id);
    getCourseById(courseId).then((data) => {
        res.render('course', { course: data });
    }).catch((err) => {
        res.status(404).send("Course not found");
    });
});

app.post("/student/update", (req, res) => {
    updateStudent(req.body)
        .then(() => { res.redirect("/students") })
        .catch(err => {
            res.status(500).send("Unable to update student");
        });
});


// Handle 404 - Keep this as the last route
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// Initialize collegeData and start server
initialize().then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to initialize data:", err);
});
