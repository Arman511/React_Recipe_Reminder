var recipe_data = "";
const recipe_container = document.getElementById("recipe_box");

const get_recipes = async () => {
    const response = await fetch("/api/read_all");

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
