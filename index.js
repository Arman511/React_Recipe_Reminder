const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// App setup
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
});

// Static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/user_recipes", async (_, res) => {
    res.sendFile("public/user_recipes.html", { root: __dirname });
});
app.get("/create_account", async (_, res) => {
    res.sendFile("public/account_create.html", { root: __dirname });
});

app.get("/add_recipe", async (_, res) => {
    res.sendFile("public/add_recipe.html", { root: __dirname });
});

app.get("/edit_profile", async (_, res) => {
    res.sendFile("public/edit_profile.html", { root: __dirname });
});

app.get("/edit_recipe", async (_, res) => {
    res.sendFile("public/edit_recipe.html", { root: __dirname });
});

app.get("/recipes", async (_, res) => {
    res.sendFile("public/recipes.html", { root: __dirname });
});
app.get("/search", async (_, res) => {
    res.sendFile("public/recipes.html", { root: __dirname });
});

const last_recipe_check = { date: new Date(), response: null };

const template_page = fs.readFileSync(
    path.join(__dirname, "template.html"),
    "utf8"
);

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
        return response.data.record;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return { error: "Internal Server Error, Try again later" };
    }
};

const last_author_check = { date: new Date(), response: null };

const get_authors = async () => {
    if (
        last_author_check.response !== null &&
        last_author_check.date > new Date(Date.now() - 1000 * 60 * 60)
    ) {
        return last_author_check.response;
    }

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

        last_author_check.date = new Date();
        last_author_check.response = response.data.record;

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

app.get("/recipe/:id", async (req, res) => {
    const recipeId = req.params.id;
    // Fetch the recipe with the given id from the database
    try {
        const response = await get_recipes();
        if (response.error) {
            return res.status(500).json({ error: response.error });
        }
        const recipes = response.recipes;
        const recipe = recipes.find((recipe) => recipe.id === Number(recipeId));
        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        const page = template_page;
        const stepsList = recipe.steps
            .map((step) => `<li>${step.text}</li>`)
            .join("");
        let stars_div = "<div>";
        for (let i = 1; i <= 5; i++) {
            stars_div += `<span class="fa fa-star ${
                recipe.star >= i ? "checked" : ""
            }"></span>`;
        }
        stars_div += "</div>";
        const recipeHTML = `
        <h2>${recipe.title}</h2>
        <p>${recipe.description}</p>
        <p>${stars_div}</p>
        <p>Servings: ${recipe.servings}</p>
        <p>Prep Time: ${recipe.prepTime} minutes</p>
        <p>Cook Time: ${recipe.cookTime} minutes</p>
        <p>Ingredients: ${recipe.ingredients.join(", ")}</p>
        <p>Author: ${recipe.author}</p>
        <ol>Steps: ${stepsList}</ol>
        `;
        const finalPage = page.replace("{{content}}", recipeHTML);

        res.send(finalPage);
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.post("/api/create_account", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
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

        last_author_check.response = putJSON;

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

app.post("/api/user_recipes_login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const response = await get_authors();
        if (response.error) {
            return res.status(500).json({ error: response.error });
        }
        const authors = response.users;
        const author = authors.find(
            (author) => author.email === email && author.pass === password
        );
        if (!author) {
            console.log("Author not found/Invalid password");
            return res.status(400).json({ error: "User not found" });
        }

        const recipes = await get_recipes();
        if (recipes.error) {
            return res.status(500).json({ error: recipes.error });
        }

        const user_recipes = recipes.recipes.filter(
            (recipe) => recipe.authorID === author.id
        );

        const recipe_names = user_recipes.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
        }));
        console.log(recipe_names);
        res.json(recipe_names);
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
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
        prepTime,
        cookTime,
        star,
        ingredients,
        steps,
        email,
        password,
    } = req.body;
    console.log(req.body);
    if (
        !title ||
        !description ||
        !servings ||
        !prepTime ||
        !cookTime ||
        !star ||
        !ingredients ||
        !steps ||
        !email ||
        !password
    ) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (steps.length === 0 || ingredients.length === 0) {
        return res.status(400).json({
            error: "You need to add at least one ingredient and one step",
        });
    }
    if (
        isNaN(servings) ||
        isNaN(prepTime) ||
        isNaN(cookTime) ||
        isNaN(star) ||
        star > 5 ||
        star < 0
    ) {
        return res.status(400).json({ error: "Invalid input" });
    }
    const stepsFormatter = steps.map((step) => ({
        stepNumber: steps.indexOf(step) + 1,
        text: step,
    }));
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
            star: star,
            steps: stepsFormatter,
            ingredients: ingredients,
            servings: servings,
            prepTime: prepTime,
            cookTime: cookTime,
            creationDate: new Date().toISOString(),
            author: author.name,
            authorID: author.id,
        };
        recipes.push(newRecipe);
        const putJSON = {
            latestID: response_recipes.latestID + 1,
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
        last_recipe_check.response = putJSON;
        res.json({ message: "Recipe created successfully", id: newRecipe.id });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.post("/api/edit_account", async (req, res) => {
    const { email, new_email, new_name, password, new_password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (!new_email && !new_password && !new_name) {
        return res.status(400).json({ error: "No changes detected" });
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(new_email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    if (new_password.length < 8) {
        return res
            .status(400)
            .json({ error: "Password must be at least 8 characters long" });
    }
    if (new_password !== new_password_confirm) {
        return res.status(400).json({ error: "Passwords do not match" });
    }
    try {
        const response_authors = await get_authors();
        if (response_authors.error) {
            return res.status(500).json({ error: response_authors.error });
        }
        const authors = response_authors.users;
        const author = authors.find((author) => author.email === email);
        if (new_email && authors.some((author) => author.email === new_email)) {
            return res.status(400).json({ error: "Email already exists" });
        }
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
        if (new_email) {
            author.email = new_email;
        }
        if (new_name) {
            author.name = new_name;
        }
        if (new_password) {
            author.pass = new_password;
        }

        const putJSON = {
            latestID: response_authors.latestID,
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
        last_author_check.response = putJSON;
        res.json({ message: "Account updated successfully" });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.post("/api/recipe", async (req, res) => {
    const response = await get_recipes();
    if (response.error) {
        return res.status(500).json({ error: response.error });
    }
    const recipe = response.recipes.find(
        (recipe) => recipe.id === Number(req.body.recipeID)
    );
    if (!recipe) {
        return res.status(400).json({ error: "Recipe not found" });
    }
    res.json(recipe);
});

app.post("/api/recipe_update", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const response = await get_authors();
        if (response.error) {
            return res.status(500).json({ error: response.error });
        }
        const authors = response.users;
        const author = authors.find(
            (author) => author.email === email && author.pass === password
        );
        if (!author) {
            console.log("Author not found/Invalid password");
            return res.status(400).json({ error: "User not found" });
        }

        const recipes = await get_recipes();
        const {
            recipeID,
            title,
            description,
            servings,
            prep_time,
            cook_time,
            star,
            ingredients,
            steps,
        } = req.body;

        if (
            !recipeID ||
            !title ||
            !description ||
            !servings ||
            !prep_time ||
            !cook_time ||
            !star ||
            !ingredients ||
            !steps
        ) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (steps.length === 0 || ingredients.length === 0) {
            return res.status(400).json({
                error: "At least one ingredient and step are required",
            });
        }

        if (
            isNaN(servings) ||
            isNaN(prep_time) ||
            isNaN(cook_time) ||
            isNaN(star) ||
            star > 5 ||
            star < 0
        ) {
            return res.status(400).json({ error: "Invalid input" });
        }

        const stepsFormatter = steps.map((step) => ({
            stepNumber: steps.indexOf(step) + 1,
            text: step,
        }));

        const recipeIndex = recipes.recipes.findIndex(
            (recipe) => recipe.id === Number(recipeID)
        );

        if (recipeIndex === -1) {
            return res.status(400).json({ error: "Recipe not found" });
        }

        if (recipes.recipes[recipeIndex].authorID !== author.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        recipes.recipes[recipeIndex] = {
            id: Number(recipeID),
            title: title,
            description: description,
            star: star,
            steps: stepsFormatter,
            ingredients: ingredients,
            servings: servings,
            prep_time: prep_time,
            cook_time: cook_time,
            creationDate: recipes.recipes[recipeIndex].creationDate,
            email: recipes.recipes[recipeIndex].email,
            authorID: recipes.recipes[recipeIndex].authorID,
        };

        const putJSON = {
            latestID: recipes.latestID,
            recipes: recipes.recipes,
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

        last_recipe_check.response = putJSON;

        res.json({ message: "Recipe updated successfully" });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.post("/api/recipe_delete", async (req, res) => {
    const { email, password, recipeID } = req.body;

    if (!email || !password || !recipeID) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const response = await get_authors();
        if (response.error) {
            return res.status(500).json({ error: response.error });
        }
        const authors = response.users;
        const author = authors.find(
            (author) => author.email === email && author.pass === password
        );
        if (!author) {
            console.log("Author not found/Invalid password");
            return res.status(400).json({ error: "User not found" });
        }

        const recipes = await get_recipes();
        if (recipes.error) {
            return res.status(500).json({ error: recipes.error });
        }

        const recipeIndex = recipes.recipes.findIndex(
            (recipe) => recipe.id === Number(recipeID)
        );

        if (recipeIndex === -1) {
            return res.status(400).json({ error: "Recipe not found" });
        }

        if (recipes.recipes[recipeIndex].authorID !== author.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        recipes.recipes.splice(recipeIndex, 1);

        const putJSON = {
            latestID: recipes.latestID,
            recipes: recipes.recipes,
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

        last_recipe_check.response = putJSON;

        res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});
