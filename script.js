// ========================================
// PRJ LOSTLINK - MAIN JAVASCRIPT
// ========================================


// ========================================
// GOOGLE SHEET
// ========================================

const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2f-TYo7GhC5rCURjJ29sp-jBOV4Ki_g5cL84HOUoqXm6XPc08i4Dp43pG91GpOiyLY2e00SArOzGE/pub?output=csv";


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
// LOAD GOOGLE SHEET
// ========================================

async function getGoogleSheetItems() {

    const response = await fetch(sheetURL);

    if (!response.ok) {
        throw new Error("Could not load Google Sheet.");
    }

    const csv = await response.text();

    const rows = parseCSV(csv);

    if (rows.length < 2) {
        return [];
    }

    const headers = rows[0].map(header =>
        header.trim()
    );

    return rows.slice(1).map(row => {

        let item = {};

        headers.forEach((header, index) => {
            item[header] = row[index] || "";
        });

        return item;
    });
}


// ========================================
// SEARCH
// ========================================

async function searchItem() {

    const searchBox =
        document.getElementById("searchBox");

    const resultsBox =
        document.getElementById("results");

    if (!searchBox || !resultsBox) {
        return;
    }

    const keyword =
        searchBox.value.trim().toLowerCase();

    if (keyword === "") {

        resultsBox.innerText =
            "Please enter a search term.";

        return;
    }

    resultsBox.innerText =
        "Searching...";

    try {

        const items =
            await getGoogleSheetItems();

        const approved =
            items.filter(item =>
                String(item["Status"])
                    .trim()
                    .toLowerCase() === "approved"
            );

        const results =
            approved.filter(item => {

                const name =
                    String(item["Item name"] || "")
                        .toLowerCase();

                const description =
                    String(item["Descption"] || "")
                        .toLowerCase();

                const location =
                    String(item["Location found"] || "")
                        .toLowerCase();

                return (
                    name.includes(keyword) ||
                    description.includes(keyword) ||
                    location.includes(keyword)
                );
            });


        if (results.length === 0) {

            resultsBox.innerText =
                "No approved items found.";

            return;
        }


        resultsBox.innerHTML =
            results.map(item => {

                return `
                    <p>
                        <strong>
                            ${escapeHTML(
                                item["Item name"] ||
                                "Unknown item"
                            )}
                        </strong>
                        <br>

                        ${escapeHTML(
                            item["Descption"] || ""
                        )}
                        <br>

                        Location:
                        ${escapeHTML(
                            item["Location found"] ||
                            "Unknown"
                        )}
                        <br>

                        Date:
                        ${escapeHTML(
                            item["Date"] ||
                            "Unknown"
                        )}
                    </p>

                    <hr>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        resultsBox.innerText =
            "Unable to search the items right now.";
    }
}


// ========================================
// SUBMIT ITEM - LOCAL TEST
// ========================================

function submitItem() {

    const name =
        document.getElementById("itemName").value;

    const description =
        document.getElementById("description").value;

    const location =
        document.getElementById("location").value;

    const date =
        document.getElementById("date").value;


    if (name === "") {

        document.getElementById("message").innerText =
            "Please enter an item name.";

        return;
    }


    const items =
        getItems();


    const newItem = {

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

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;


    if (
        username === "admin" &&
        password === "1234"
    ) {

        window.location.href =
            "admin-dashboard.html";

    } else {

        document.getElementById("loginMessage").innerText =
            "Incorrect username or password.";
    }
}


// ========================================
// ADMIN DASHBOARD
// ========================================

function loadAdminItems() {

    const items =
        getItems();


    const container =
        document.getElementById("pendingItems");


    if (!container) {
        return;
    }


    const pending =
        items.filter(item =>
            item.status === "Pending"
        );


    if (pending.length === 0) {

        container.innerHTML =
            "<p>No pending submissions.</p>";

        return;
    }


    container.innerHTML =
        pending.map(item => {

            return `
                <div>

                    <hr>

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <br>

                    Description:
                    ${escapeHTML(item.description)}

                    <br>

                    Location:
                    ${escapeHTML(item.location)}

                    <br>

                    Date:
                    ${escapeHTML(item.date)}

                    <br><br>

                    <button onclick="approveItem(${item.id})">
                        Approve
                    </button>

                    <button onclick="rejectItem(${item.id})">
                        Reject
                    </button>

                </div>
            `;

        }).join("");
}


// ========================================
// APPROVE ITEM
// ========================================

function approveItem(id) {

    let items =
        getItems();


    const item =
        items.find(item =>
            item.id === id
        );


    if (item) {

        item.status =
            "Approved";
    }


    saveItems(items);

    loadAdminItems();
}


// ========================================
// REJECT ITEM
// ========================================

function rejectItem(id) {

    let items =
        getItems();


    items =
        items.filter(item =>
            item.id !== id
        );


    saveItems(items);

    loadAdminItems();
}


// ========================================
// DISPLAY LATEST ITEMS
// ========================================

async function loadLatestItems() {

    const container =
        document.getElementById("latestItems");


    if (!container) {
        return;
    }


    container.innerHTML =
        "Loading...";


    try {

        const items =
            await getGoogleSheetItems();


        const approved =
            items.filter(item =>
                String(item["Status"])
                    .trim()
                    .toLowerCase() === "approved"
            );


        // Newest first
        approved.sort((a, b) =>
            new Date(b["Timestamp"]) -
            new Date(a["Timestamp"])
        );


        // Homepage: only 3 newest
        const recent =
            approved.slice(0, 3);


        if (recent.length === 0) {

            container.innerHTML =
                "<p>No approved items yet.</p>";

            return;
        }


        container.innerHTML =
            recent.map(item => {

                return `
                    <p>
                        <strong>
                            ${escapeHTML(
                                item["Item name"] ||
                                "Unknown item"
                            )}
                        </strong>
                    </p>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Google Sheet error:",
            error
        );


        container.innerHTML =
            "<p>Unable to load latest items.</p>";
    }
}


// ========================================
// LATEST PAGE - ALL APPROVED ITEMS
// ========================================

async function loadAllLatestItems() {

    const container =
        document.getElementById("allLatestItems");


    if (!container) {
        return;
    }


    container.innerHTML =
        "Loading...";


    try {

        const items =
            await getGoogleSheetItems();


        const approved =
            items.filter(item =>
                String(item["Status"])
                    .trim()
                    .toLowerCase() === "approved"
            );


        approved.sort((a, b) =>
            new Date(b["Timestamp"]) -
            new Date(a["Timestamp"])
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
                            ${escapeHTML(
                                item["Item name"] ||
                                "Unknown item"
                            )}
                        </strong>
                    </p>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Latest items error:",
            error
        );


        container.innerHTML =
            "<p>Unable to load latest items.</p>";
    }
}


// ========================================
// SIMPLE CSV PARSER
// ========================================

function parseCSV(text) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const character =
            text[i];

        const nextCharacter =
            text[i + 1];


        if (
            character === '"' &&
            insideQuotes &&
            nextCharacter === '"'
        ) {

            value += '"';

            i++;

        }

        else if (
            character === '"'
        ) {

            insideQuotes =
                !insideQuotes;

        }

        else if (
            character === "," &&
            !insideQuotes
        ) {

            row.push(value);

            value = "";

        }

        else if (
            (
                character === "\n" ||
                character === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                character === "\r" &&
                nextCharacter === "\n"
            ) {

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


    if (
        value !== "" ||
        row.length > 0
    ) {

        row.push(value);

        rows.push(row);
    }


    return rows;
}


// ========================================
// SECURITY / HTML ESCAPING
// ========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// START FUNCTIONS
// ========================================

// Admin dashboard

if (
    document.getElementById("pendingItems")
) {

    loadAdminItems();
}


// Homepage - 3 latest items

if (
    document.getElementById("latestItems")
) {

    loadLatestItems();
}


// Latest items page - full list

if (
    document.getElementById("allLatestItems")
) {

    loadAllLatestItems();
}