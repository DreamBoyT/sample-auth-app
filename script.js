// MSAL configuration
const msalConfig = {
    auth: {
        clientId: "d24bfde1-e062-49da-8129-5bdcf609b00b", // Your client ID
        authority: "https://login.microsoftonline.com/4d4343c6-067a-4794-91f3-5cb10073e5b4", // Your tenant ID
        redirectUri: "https://brave-water-03e171b00.5.azurestaticapps.net" // Your redirect URI
    },
    cache: {
        cacheLocation: "localStorage", // or "sessionStorage"
        storeAuthStateInCookie: false
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const generateButton = document.getElementById("generateBtn");
const messageDiv = document.getElementById("message");

function updateUI() {
    const account = msalInstance.getActiveAccount();
    if (account) {
        loginButton.style.display = "none";
        logoutButton.style.display = "inline-block";
        generateButton.disabled = false;
    } else {
        loginButton.style.display = "inline-block";
        logoutButton.style.display = "none";
        generateButton.disabled = true;
    }
}

async function login() {
    try {
        const loginResponse = await msalInstance.loginPopup({
            scopes: ["user.read"]
        });
        console.log("Login successful:", loginResponse);
        msalInstance.setActiveAccount(loginResponse.account);
        updateUI();
    } catch (error) {
        console.error("Login failed:", error);
    }
}

function logout() {
    msalInstance.logoutPopup().then(() => {
        msalInstance.setActiveAccount(null);
        updateUI();
    }).catch(error => {
        console.error("Logout failed:", error);
    });
}

loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);

async function handlePageLoad() {
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
            msalInstance.setActiveAccount(response.account);
        }
        updateUI();
    } catch (error) {
        console.error(error);
        updateUI();
    }
}

handlePageLoad();

generateButton.addEventListener("click", async () => {
    const account = msalInstance.getActiveAccount();
    if (!account) {
        alert("Please login to generate images.");
        return;
    }

    const prompt = document.getElementById("prompt").value;
    if (prompt.trim() === "") {
        alert("Please enter an image description.");
        return;
    }

    const imageContainer = document.getElementById("imageContainer");
    const loadingSpinner = document.getElementById("loadingSpinner");

    imageContainer.innerHTML = "";
    loadingSpinner.style.display = "block";

    try {
        const response = await fetch("https://dall-t.azurewebsites.net/api/httpTriggerts", {  // Replace with your Azure Function URL
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        if (response.ok) {
            const { imageUrls } = await response.json();
            loadingSpinner.style.display = "none";
            imageUrls.forEach(url => {
                const img = document.createElement("img");
                img.src = url;
                img.alt = prompt;
                img.style.width = "100%";
                img.style.maxWidth = "256px";
                img.style.borderRadius = "10px";
                imageContainer.appendChild(img);
            });
        } else {
            loadingSpinner.style.display = "none";
            imageContainer.innerHTML = "Failed to generate image. Please try again.";
        }
    } catch (error) {
        console.error("Error:", error);
        loadingSpinner.style.display = "none";
        imageContainer.innerHTML = "Failed to generate image. Please try again.";
    }
});
