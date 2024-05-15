const email = document.getElementById("email");
const new_email = document.getElementById("new_email");
const password = document.getElementById("password");
const new_password = document.getElementById("new_password");
const new_password_confirm = document.getElementById("new_password_confirm");
const new_name = document.getElementById("new_name");

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

const btn_edit_acc = document.getElementById("btn_edit_acc");

btn_edit_acc.addEventListener("click", async () => {
    if (!email.value || !password.value) {
        return alert("Missing required fields");
    }
    if (
        !new_email.value &&
        !new_password.value &&
        !new_password_confirm.value &&
        !new_name.value
    ) {
        return alert("No changes detected");
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(new_email.value)) {
        return alert("Invalid email format");
    }
    if (new_password.value.length < 8) {
        return alert("Password must be at least 8 characters long");
    }
    if (new_password.value !== new_password_confirm.value) {
        return alert("Passwords do not match");
    }
    const response = await fetch("/api/edit_account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email.value,
            new_email: new_email.value,
            new_name: new_name.value,
            password: await hashing(password.value),
            new_password: await hashing(new_password.value),
        }),
    });
    const data = await response.json();
    if (data.error) {
        return alert(data.error);
    }
    alert("Account updated successfully");
    window.location.href = "/";
});
