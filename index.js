const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const express = require("express");

const authMiddleware = require("./authMiddleware");
require("dotenv").config();

const supabase = require("./supabase");

const app = express();
const swaggerDocument = YAML.load("./swagger.yaml");
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);
// Signup
app.post("/auth/signup", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required"
        });
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    res.status(201).json({
        user: data.user
    });
});
// Login
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required"
        });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return res.status(401).json({
            error: "Invalid login credentials"
        });
    }

    res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
    });
});
app.get("/", (req, res) => {
    res.json({
        message: "Task API Auth",
        status: "running"
    });
});
// Public Route
app.get("/public/info", (req, res) => {
    res.status(200).json({
        message: "Welcome stranger! This info is public."
    });
});

app.get("/protected/profile", authMiddleware, (req, res) => {
    res.status(200).json({
        id: req.user.id,
        email: req.user.email,
        created_at: req.user.created_at
    });
});
app.post("/auth/logout", authMiddleware, async (req, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        return res.status(500).json({
            error: error.message
        });
    }

    res.sendStatus(204);
});
app.get("/protected/dashboard", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "Welcome to dashboard",
        userId: req.user.id
    });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});