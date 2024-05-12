const btn_create_account = document.getElementById("btn_create_account");

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

btn_create_account.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("password2").value;
    if (password === "" || name === "" || email === "") {
        alert("Username and password are required");
        return;
    }
    if (password.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }
    const response = await fetch("/api/create_account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            password: await hashing(password),
            email: email,
            name: name,
            confirmPassword: await hashing(confirmPassword),
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
