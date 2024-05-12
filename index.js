const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
// App setup
const PORT = process.env.PORT || 3000;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
});

// Static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const last_recipe_check = { date: new Date(), response: null };

const get_recipes = async () => {
    if (
        last_recipe_check.response !== null &&
        last_recipe_check.date > new Date(Date.now() - 1000 * 60 * 60)
    ) {
        return last_recipe_check.response;
    }
    try {
        const response = await axios.get(
            "https://api.jsonbin.io/v3/b/663e866de41b4d34e4f1c7ab/latest",
            {
                headers: {
                    "X-Access-Key": process.env.JSON_BIN_KEY,
                },
            }
        );
        if (!response.data) {
            throw new Error("Empty response received");
        }
        last_recipe_check.date = new Date();
        last_recipe_check.response = response.data.record;
        return response;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return { error: "Internal Server Error, Try again later" };
    }
};

const get_authors = async () => {
    try {
        const response = await axios.get(
            "https://api.jsonbin.io/v3/b/663e868ee41b4d34e4f1c7bd/latest",
            {
                headers: {
                    "X-Access-Key": process.env.JSON_BIN_KEY,
                },
            }
        );
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data.record;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return { error: "Internal Server Error, Try again later" };
    }
};

app.get("/api/read_all", async (req, res) => {
    const response = await get_recipes();
    if (response.error) {
        return res.status(500).json({ error: response.error });
    }
    res.json(response.recipes);
});

app.get("/user_recipes", async (_, res) => {
    res.sendFile("public/user_recipes.html", { root: __dirname });
});
app.get("/create_account", async (_, res) => {
    res.sendFile("public/account_create.html", { root: __dirname });
});

app.get("/add_recipe", async (_, res) => {
    res.sendFile("public/add_recipe.html", { root: __dirname });
});

app.post("/api/create_account", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 8) {
        return res
            .status(400)
            .json({ error: "Password must be at least 8 characters long" });
    }
    try {
        const response = await get_authors();
        if (response.error) {
            return res.status(500).json({ error: response.error });
        }
        const authors = response.users;
        const author = authors.find((author) => author.email === email);
        if (author) {
            return res.status(400).json({ error: "Email already in use" });
        }
        const newAuthor = {
            id: response.latestID + 1,
            name: name,
            email: email,
            favorites: [],
            ignored: [],
            pass: password,
        };
        authors.push(newAuthor);
        const putJSON = {
            latestID: response.latestID + 1,
            users: authors,
        };
        const putResponse = await axios.put(
            "https://api.jsonbin.io/v3/b/663e868ee41b4d34e4f1c7bd",
            putJSON,
            {
                headers: {
                    "X-Access-Key": process.env.JSON_BIN_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        if (putResponse.error) {
            return res.status(500).json({ error: putResponse.error });
        }
        res.json({ message: "Account created successfully" });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.post("/api/user_specific", async (req, res) => {
    const response = await get_recipes();
    if (response.error) {
        return res.status(500).json({ error: response.error });
    }
    const user_recipes = response.recipes.filter(
        (recipe) => recipe.authorID === Number(req.body.authorID)
    );
    res.json(user_recipes);
});

app.get("/api/authors", async (_, res) => {
    try {
        const response = await get_authors();
        if (response.error) {
            return res.status(500).json({ error: response.error });
        }
        const authors = response.users.map((author) => ({
            id: author.id,
            name: author.name,
        }));
        res.json(authors);
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.post("/api/create_recipe", async (req, res) => {
    const {
        title,
        description,
        servings,
        prep_time,
        cook_time,
        stars,
        ingredients,
        steps,
        email,
        password,
    } = req.body;
    if (
        !title ||
        !description ||
        !servings ||
        !prep_time ||
        !cook_time ||
        !stars ||
        !ingredients ||
        !steps ||
        !email ||
        !password
    ) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const response_authors = await get_authors();
        if (response_authors.error) {
            return res.status(500).json({ error: response_authors.error });
        }
        const authors = response_authors.users;
        const author = authors.find((author) => author.email === email);
        if (!author) {
            return res
                .status(400)
                .json({ error: "Author not found/Invalid password" });
        }
        if (author.pass !== password) {
            return res
                .status(400)
                .json({ error: "Author not found/Invalid password" });
        }
        const response_recipes = await get_recipes();
        if (response_recipes.error) {
            return res.status(500).json({ error: response_recipes.error });
        }
        const recipes = response_recipes.recipes;
        const newRecipe = {
            id: response_recipes.latestID + 1,
            title: title,
            description: description,
            servings: servings,
            prep_time: prep_time,
            cook_time: cook_time,
            stars: stars,
            ingredients: ingredients,
            steps: steps,
            authorID: author.id,
        };
        recipes.push(newRecipe);
        const putJSON = {
            latestID: response.latestID + 1,
            recipes: recipes,
        };
        const putResponse = await axios.put(
            "https://api.jsonbin.io/v3/b/663e866de41b4d34e4f1c7ab",
            putJSON,
            {
                headers: {
                    "X-Access-Key": process.env.JSON_BIN_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        if (putResponse.error) {
            return res.status(500).json({ error: putResponse.error });
        }
        res.json({ message: "Recipe created successfully" });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});
