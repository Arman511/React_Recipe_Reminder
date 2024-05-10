var recipe_data = "";

function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest("SHA-256", utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((bytes) => bytes.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    });
}
const recipe_container = document.getElementById("recipe_box");
const email = prompt("Enter email");
const pass = hash(prompt("Enter password"));
console.log(pass);
const get_recipes = async () => {
    const response = await fetch("/api/user_specific", {
        method: "POST",
        body: JSON.stringify({
            email: email,
            pass: pass,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        },
    });

    if (!response.ok) {
        const message = document.createElement("div");
        message.className = "error";
        message.innerHTML = `<h2>An error has occurred: ${response.statusText}</h2>`;
        news_container.appendChild(message);
        console.error("There was a problem with the fetch operation");
        return;
    }

    const data = await response.json();
    var content = [];

    data.forEach((recipe) => {
        const recipe_div = document.createElement("div");
        recipe_div.className = "recipe";
        const stepsList = recipe.steps
            .map((step) => `<li>${step.text}</li>`)
            .join("");
        recipe_div.innerHTML = `
            <h2>${recipe.title}</h2>
            <p>${recipe.description}</p>
            <p>Stars: ${recipe.star}</p>
            <p>Servings: ${recipe.servings}</p>
            <p>Prep Time: ${recipe.prepTime} minutes</p>
            <p>Cook Time: ${recipe.cookTime} minutes</p>
            <p>Ingredients: ${recipe.ingredients.join(", ")}</p>
            <p>Author: ${recipe.author}</p>
            <ol>Steps: ${stepsList}</ol>
        `;
        content.push(recipe_div.outerHTML);
    });
    recipe_container.innerHTML = content.join("<hr>");
};

get_recipes();
