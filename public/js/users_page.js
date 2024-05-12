var recipe_data = "";

const recipe_container = document.getElementById("recipe_box");
const authors_select_box = document.getElementById("select_author");

const fill_author_box = async () => {
    const response = await fetch("/api/authors");
    if (!response.ok) {
        const message = document.createElement("div");
        message.className = "error";
        message.innerHTML = `<h2>An error has occurred: ${response.statusText}</h2>`;
        recipe_container.appendChild(message);
        console.error("There was a problem with the fetch operation");
        return;
    }

    const data = await response.json();
    const authors = data
        .map((author) => `<option value="${author.id}">${author.name}</option>`)
        .join("");
    authors_select_box.innerHTML = authors;
};

const select_button = document.getElementById("btn_select_author");

select_button.addEventListener("click", async () => {
    const author_id = authors_select_box.value;
    const response = await fetch("/api/user_specific", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ authorID: author_id }),
    });

    if (!response.ok) {
        const message = document.createElement("div");
        message.className = "error";
        message.innerHTML = `<h2>An error has occurred: ${response.statusText}</h2>`;
        recipe_container.appendChild(message);
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
        const stars_div = document.createElement("div");
        for (let i = 1; i <= 5; i++) {
            stars_div.innerHTML += `<span class="fa fa-star ${
                recipe.star >= i ? "checked" : ""
            }"></span>`;
        }
        recipe_div.innerHTML = `
            <h2>${recipe.title}</h2>
            <p>${recipe.description}</p>
            <p>${stars_div.outerHTML}</p>
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
});

fill_author_box();
