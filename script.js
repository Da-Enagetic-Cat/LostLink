async function loadGoogleSheetItems() {

    const container =
        document.getElementById("approvedItems");

    if (!container) {
        return;
    }

    container.innerHTML =
        "Loading...";

    try {

        const items =
            await getGoogleSheetItems();

        // Only approved items
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

        // Only the 3 newest
        const recent =
            approved.slice(0, 3);

        if (recent.length === 0) {

            container.innerHTML =
                "<p>No approved items yet.</p>";

            return;
        }

        // Show ONLY item names
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
            "<p>Unable to load items from Google Sheets.</p>";
    }
}