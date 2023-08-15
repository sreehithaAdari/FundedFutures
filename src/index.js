//index.js

const express = require("express");
const session = require("express-session"); 
const path = require("path");
const app = express();
const hbs = require("hbs");
const student_collection = require("./db/student_conn")
const organiser_collection = require("./db/organiser_conn")
const Scholarship = require("./db/scholarship_details");

// const authMiddleware = require("./middlewares/auth");
const { error } = require("console");

const port = process.env.PORT || 3000;
const public_path = path.join(__dirname, "public");
app.use(express.static(public_path));
const views_path = path.join(__dirname, "../views");

hbs.registerPartials(path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));

app.use(express.json())
app.set("view engine", "hbs");
app.set("views", views_path);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
 
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.use(
    session({
        secret: "your_session_secret_here", // Replace with your session secret
        resave: false,
        saveUninitialized: true,
    })
);


app.get('/home-org', (req, res) => {
    // Here you would render the appropriate template or perform other actions
    res.render('home-org'); // Assuming 'home-org' is the template name
  });

  app.get('/home-stu', (req, res) => {
    // Here you would render the appropriate template or perform other actions
    res.render('home-stu'); // Assuming 'home-org' is the template name
  });

// Add this route to display scholarships on student profile page
app.get("/student-profile", async (req, res) => {
    try {
        const scholarships = await Scholarship.find({});
        res.render("student-profile", { scholarships });
    } catch (error) {
        console.error("Error fetching scholarships:", error);
        res.send("Error fetching scholarships");
    }
});

app.get("/scholarships", async (req, res) => {
    try {
        const scholarships = await Scholarship.find({});
        res.render("scholarships", { scholarships });
    } catch (error) {
        console.error("Error fetching scholarships:", error);
        res.send("Error fetching scholarships");
    }
});

app.get("/applied-scholarships", async (req, res) => {
    try {
        if (req.session.user && req.session.user.userType === "student") {
            const student = await student_collection.findOne({ email: req.session.user.email });
            if (student) {
                const appliedScholarships = await Scholarship.find({ applicants: student._id });
                res.render("applied-scholarships", { appliedScholarships });
            } else {
                res.send("No student account found.");
            }
        } else {
            res.send("You must be logged in as a student to view applied scholarships.");
        }
    } catch (error) {
        console.error("Error fetching applied scholarships:", error);
        res.send("Error fetching applied scholarships");
    }
});



app.post("/apply-scholarship", async (req, res) => {
    try {
        console.log("Session user:", req.session.user);

        if (!req.session.user || req.session.user.userType !== "student") {
            console.log("User not authenticated as a student");

            return res.send("You must be logged in as a student to apply for scholarships.");
        }

        // Get the scholarship ID from the form
        const scholarshipId = req.body.scholarshipId;

        // Find the scholarship by ID
        const scholarship = await Scholarship.findById(scholarshipId);

        if (!scholarship) {
            return res.send("Scholarship not found.");
        }

        const student = await student_collection.findOne({ email: req.session.user.email });
        if (!student) {
            return res.send("No student account found.");
        }

        // Add the student's ID to the scholarship's applicants array
        scholarship.applicants.push(student._id);
        await scholarship.save();
        
        res.redirect("/applied-scholarships");
    } catch (error) {
        console.error("Error applying for scholarship:", error);
        res.send("Error applying for scholarship");
    }
});


app.post("/register", async (req, res) => {
    const signup_data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    };

    const userType = req.body.userType; // Get the selected user type (student or organizer)

    if (userType === "student") {
        try {
            const student = new student_collection(signup_data);
            await student.save();
            res.render("home-stu");
        } catch (error) {
            res.send("Error registering student");
        }
    } else if (userType === "organizer") {
        try {
            const organizer = new organiser_collection(signup_data);
            await organizer.save();
            res.render("home-org");
        } catch (error) {
            res.send("Error registering organizer");
        }
    } else {
        res.send("Invalid user type");
    }
});

app.post("/login", async (req, res) => {
    const userType = req.body.userType; // Get the selected user type (student or organizer)

    if (userType === "student") {
        try {
            const student = await student_collection.findOne({ email: req.body.email });

            if (student && student.password === req.body.password) {
                req.session.user = {
                    email: req.body.email,
                    userType: "student",
                };
                console.log("Student logged in:", req.session.user); // Debug log

                
                res.render("home-stu");
            } else {
                res.send("Incorrect Student Email or Password");
            }
        } catch (error) {
            console.error("Error finding student:", error);
            res.send("No student account with that email found");
        }
    } else if (userType === "organizer") {
        try {
            const organizer = await organiser_collection.findOne({ email: req.body.email });

            if (organizer && organizer.password === req.body.password) {
                
                req.session.user = {
                    email: req.body.email,
                    userType: "organizer",
                    // Add other organizer-related information if needed
                  };

                res.render("home-org");
            } else {
                res.send("Incorrect Organizer Email or Password");
            }
        } catch (error) {
            console.error("Error finding organizer:", error);
            res.send("No organizer account with that email found");
        }
    } else {
        res.send("Invalid user type");
    }
});

app.post("/add-scholarship", async (req, res) => {
    try {
        // Check if the user is an organizer
        if (req.session.user && req.session.user.userType === "organizer") {
            const scholarshipData = {
                title: req.body.title,
                description: req.body.description,
                amount: req.body.amount,
                email: req.session.user.email, // Use the logged-in organizer's email
                // Add other scholarship details here
            };

            const scholarship = new Scholarship(scholarshipData);
            await scholarship.save();
            res.redirect("/scholarships"); // Redirect to the scholarships page
        } else {
            res.send("You must be logged in as an organizer to add scholarships.");
        }
    } catch (error) {
        console.error("Error adding scholarship:", error);
        res.send("Error adding scholarship");
    }
});

app.post("/delete-scholarship", async (req, res) => {
    try {
        if (req.session.user && req.session.user.userType === "organizer") {
            const scholarshipId = req.body.scholarshipId;

            // Use Mongoose to find and remove the scholarship by its ID
            await Scholarship.findByIdAndRemove(scholarshipId);

            res.redirect("/scholarships"); // Redirect to the scholarships page after deletion
        } else {
            res.send("You must be logged in as an organizer to delete scholarships.");
        }
    } catch (error) {
        console.error("Error deleting scholarship:", error);
        res.send("Error deleting scholarship");
    }
});

app.get("/logout", (req, res) => {
    // Perform any logout logic (e.g., clear session, cookies, etc.) if needed
    res.render("logout");
});

app.listen(8000,function(req,res){
    console.log(`Server running on port 8000}`);
})
// app.listen(port, () => {

// });
