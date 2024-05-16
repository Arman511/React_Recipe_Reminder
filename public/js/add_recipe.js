const ingredients = [];
const steps = [];
const ingredient_list = document.getElementById("ingredient_list");

const hashing = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
};

document.getElementById("btn_add_ingredient").addEventListener("click", () => {
    const ingredient = document.getElementById("ingredient_name").value;
    const ingredient_amount =
        document.getElementById("ingredient_amount").value;
    if (ingredient === "" || ingredient_amount === "") {
        alert("Ingredient is required");
        return;
    }
    ingredients.push(`${ingredient} - ${ingredient_amount}`);
    document.getElementById("ingredient_name").value = "";
    document.getElementById("ingredient_amount").value = "";
    ingredient_list.innerHTML =
        "<ul>" +
        ingredients.map((ingredient) => `<li>${ingredient}</li>`).join("") +
        "</ul>";
});

document
    .getElementById("btn_remove_ingredient")
    .addEventListener("click", () => {
        ingredients.pop();
        ingredient_list.innerHTML =
            "<ul>" +
            ingredients.map((ingredient) => `<li>${ingredient}</li>`).join("") +
            "</ul>";
    });

const step_list = document.getElementById("step_list");

document.getElementById("btn_add_step").addEventListener("click", () => {
    const step = document.getElementById("step_description").value;
    if (step === "") {
        alert("Step is required");
        return;
    }
    steps.push(step);
    document.getElementById("step_description").value = "";
    step_list.innerHTML =
        "<ol>" + steps.map((step) => `<li>${step}</li>`).join("") + "</ol>";
});

document.getElementById("btn_remove_step").addEventListener("click", () => {
    steps.pop();
    step_list.innerHTML =
        "<ol>" + steps.map((step) => `<li>${step}</li>`).join("") + "</ol>";
});

document.getElementById("btn_submit").addEventListener("click", async () => {
    const title = document.getElementById("recipe_name").value;
    const description = document.getElementById("recipe_description").value;
    const servings = document.getElementById("servings").value;
    const prepTime = Number(document.getElementById("prep_time").value);
    const cookTime = Number(document.getElementById("cook_time").value);
    const star = Number(document.getElementById("stars").value);
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (steps.length === 0 || ingredients.length === 0) {
        alert("You need to add at least one ingredient and one step");
        return;
    }
    if (
        title === "" ||
        description === "" ||
        isNaN(servings) ||
        isNaN(prepTime) ||
        isNaN(cookTime) ||
        isNaN(star) ||
        email === "" ||
        password === ""
    ) {
        alert("All fields are required");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
    }

    const response = await fetch("/api/create_recipe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: title,
            description: description,
            servings: servings,
            prepTime: prepTime,
            cookTime: cookTime,
            star: star,
            ingredients: ingredients,
            steps: steps,
            email: email,
            password: await hashing(password),
        }),
    });

    if (!response.ok) {
        console.log(response);
        alert(`An error has occurred: ${response.statusText}`);
        console.error("There was a problem with the fetch operation");
        return;
    }

    const data = await response.json();
    const message = document.createElement("div");
    message.className = "success";
    message.innerHTML = `<h2>${data.message}</h2>`;
    const box = document.getElementById("form");
    box.innerHTML = "";
    box.appendChild(message);
});
