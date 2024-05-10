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
app.get("/api/read_all", async (req, res) => {
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
        return res.send(response.data.record);
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});

app.get("/user_recipes", async (_, res) => {
    res.sendFile("public/user_recipes.html", { root: __dirname });
});

app.post("/api/user_specific", async (req, res) => {
    try {
        // Code to create a new recipe
        // ...
    } catch (error) {
        console.error("There was a problem:", error);
        return res
            .status(500)
            .json({ error: "Internal Server Error, Try again later" });
    }
});
