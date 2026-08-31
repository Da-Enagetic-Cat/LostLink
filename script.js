// ========================================
// PRJ LOSTLINK - MAIN JAVASCRIPT
// ========================================


// ========================================
// LOCAL PROTOTYPE DATABASE
// ========================================

function getItems() {
    return JSON.parse(localStorage.getItem("lostlinkItems")) || [];
}

function saveItems(items) {
    localStorage.setItem("lostlinkItems", JSON.stringify(items));
}


// ========================================
// SEARCH
// ========================================

function searchItem() {
    let keyword = document.getElementById("searchBox").value.toLowerCase();

    if (keyword === "") {
        document.getElementById("results").innerText =
            "Please enter a search term.";
        return;
    }

    let items = getItems();

    let results = items.filter(item =>
        item.status === "Approved" &&
        (
            item.name.toLowerCase().includes(keyword) ||
            item.description.toLowerCase().includes(keyword) ||
            item.location.toLowerCase().includes(keyword)
        )
    );

    if (results.length === 0) {
        document.getElementById("results").innerText =
            "No approved items found.";
        return;
    }

    document.getElementById("results").innerHTML =
        results.map(item =>
            `<p>
                <strong>${item.name}</strong><br>
                ${item.description}<br>
                Location: ${item.location}<br>
                Date: ${item.date}
            </p>
            <hr>`
        ).join("");
}


// ========================================
// SUBMIT ITEM - LOCAL TEST
// ========================================

function submitItem() {
    let name = document.getElementById("itemName").value;
    let description = document.getElementById("description").value;
    let location = document.getElementById("location").value;
    let date = document.getElementById("date").value;

    if (name === "") {
        document.getElementById("message").innerText =
            "Please enter an item name.";
        return;
    }

    let items = getItems();

    let newItem = {
        id: Date.now(),
        name: name,
        description: description,
        location: location,
        date: date,
        status: "Pending"
    };

    items.push(newItem);

    saveItems(items);

    document.getElementById("message").innerText =
        "Submission received! Waiting for admin approval.";

    document.getElementById("itemName").value = "";
    document.getElementById("description").value = "";
    document.getElementById("location").value = "";
    document.getElementById("date").value = "";
}


// ========================================
// ADMIN LOGIN
// ========================================

function adminLogin() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "admin" && password === "1234") {
        window.location.href = "admin-dashboard.html";
    } else {
        document.getElementById("loginMessage").innerText =
            "Incorrect username or password.";
    }
}


// ========================================
// ADMIN DASHBOARD
// ========================================

function loadAdminItems() {
    let items = getItems();

    let container = document.getElementById("pendingItems");

    if (!container) {
        return;
    }

    let pending = items.filter(item =>
        item.status === "Pending"
    );

    if (pending.length === 0) {
        container.innerHTML =
            "<p>No pending submissions.</p>";
        return;
    }

    container.innerHTML =
        pending.map(item =>
            `<div>
                <hr>

                <strong>${item.name}</strong><br>

                Description: ${item.description}<br>
                Location: ${item.location}<br>
                Date: ${item.date}<br><br>

                <button onclick="approveItem(${item.id})">
                    Approve
                </button>

                <button onclick="rejectItem(${item.id})">
                    Reject
                </button>

            </div>`
        ).join("");
}


// ========================================
// APPROVE ITEM
// ========================================

function approveItem(id) {

    let items = getItems();

    let item = items.find(item =>
        item.id === id
    );

    if (item) {
        item.status = "Approved";
    }

    saveItems(items);

    loadAdminItems();
}


// ========================================
// REJECT ITEM
// ========================================

function rejectItem(id) {

    let items = getItems();

    items = items.filter(item =>
        item.id !== id
    );

    saveItems(items);

    loadAdminItems();
}


// ========================================
// GOOGLE SHEETS
// ========================================

async function loadGoogleSheetItems() {

    const sheetURL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2f-TYo7GhC5rCURjJ29sp-jBOV4Ki_g5cL84HOUoqXm6XPc08i4Dp43pG91GpOiyLY2e00SArOzGE/pub?output=csv";

    const container =
        document.getElementById("approvedItems");

    if (!container) {
        return;
    }

    container.innerHTML = "Loading...";

    try {

        const response =
            await fetch(sheetURL);

        if (!response.ok) {
            throw new Error("Could not load Google Sheet.");
        }

        const csv =
            await response.text();

        const rows =
            parseCSV(csv);

        if (rows.length < 2) {
            container.innerHTML =
                "<p>No items found.</p>";
            return;
        }

        const headers =
            rows[0].map(header =>
                header.trim()
            );

        const items =
            rows.slice(1).map(row => {

                let item = {};

                headers.forEach((header, index) => {
                    item[header] =
                        row[index] || "";
                });

                return item;
            });


        const approved =
            items.filter(item =>
                String(item["Status"])
                    .trim()
                    .toLowerCase() === "approved"
            );


        if (approved.length === 0) {

            container.innerHTML =
                "<p>No approved items yet.</p>";

            return;
        }


        container.innerHTML =
            approved.map(item => {

                return `
                    <p>
                        <strong>
                            ${item["Item name"] || "Unknown item"}
                        </strong>
                        <br>

                      ${item["Descption"] || ""}
                        <br>

                        Location:
                        ${item["Location found"] || "Unknown"}
                        <br>

                        Date:
                       ${item["Date"] || "Unknown"}
                    </p>

                    <hr>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Google Sheet error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load items from Google Sheets.</p>";
    }
}


// ========================================
// SIMPLE CSV PARSER
// Handles commas inside "quotes"
// ========================================

function parseCSV(text) {

    let rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        let character = text[i];
        let nextCharacter = text[i + 1];


        if (character === '"' && insideQuotes && nextCharacter === '"') {

            value += '"';
            i++;

        }

        else if (character === '"') {

            insideQuotes = !insideQuotes;

        }

        else if (character === "," && !insideQuotes) {

            row.push(value);
            value = "";

        }

        else if (
            (character === "\n" || character === "\r") &&
            !insideQuotes
        ) {

            if (character === "\r" && nextCharacter === "\n") {
                i++;
            }

            row.push(value);

            rows.push(row);

            row = [];
            value = "";

        }

        else {

            value += character;

        }
    }


    if (value !== "" || row.length > 0) {

        row.push(value);

        rows.push(row);

    }


    return rows;
}


// ========================================
// START FUNCTIONS
// ========================================

// Admin dashboard
if (document.getElementById("pendingItems")) {
    loadAdminItems();
}

// Homepage
if (document.getElementById("approvedItems")) {
    loadGoogleSheetItems();
}