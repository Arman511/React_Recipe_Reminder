const recipe_container = document.getElementById("recipe_box");
const recipes = [];
const search_bar = document.getElementById("search_bar");

const populate_box = () => {
    if (search_bar.value === "") {
        recipe_container.innerHTML = recipes.join("<hr>");
    }

    const search = search_bar.value.toLowerCase();

    const filtered = recipes.filter((recipe) => {
        return recipe.toLowerCase().includes(search);
    });

    recipe_container.innerHTML = filtered.join("<hr>");
};

const get_recipes = async () => {
    const response = await fetch("/api/read_all");

    if (!response.ok) {
        const message = document.createElement("div");
        message.className = "error";
        message.innerHTML = `<h2>An error has occurred: ${response.statusText}</h2>`;
        recipe_container.appendChild(message);
        console.error("There was a problem with the fetch operation");
        return;
    }

    const data = await response.json();

    data.forEach((recipe) => {
        const recipe_div = document.createElement("div");
        recipe_div.className = "recipe";
        const stepsList = recipe.steps
            .map((step) => `<li>${step.text}</li>`)
            .join("");
        const stars_div = document.createElement("div");
        for (let i = 1; i <= 5; i++) {
            stars_div.innerHTML += `<span class="fa fa-star ${
                recipe.star >= i ? "checked" : ""
            }"></span>`;
        }
        recipe_div.innerHTML = `
        <h2><a href="/recipe/${recipe.id}">${recipe.title}</a></h2>
        <p>${recipe.description}</p>
        <p>${stars_div.outerHTML}</p>
        <p>Servings: ${recipe.servings}</p>
        <p>Prep Time: ${recipe.prepTime} minutes</p>
        <p>Cook Time: ${recipe.cookTime} minutes</p>
        <p>Ingredients: ${recipe.ingredients.join(", ")}</p>
        <p>Author: ${recipe.author}</p>
        <ol>Steps: ${stepsList}</ol>
        `;
        recipes.push(recipe_div.outerHTML);
    });
    populate_box();
};

get_recipes();

search_bar.addEventListener("input", populate_box);
