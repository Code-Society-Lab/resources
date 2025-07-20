function setupNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="arrow"></div>
        <div class="message">
            Contribute to this library.
        </div>
    `;

    const githubIcon = document.querySelector('.col.p-2 a[href="https://github.com/Code-Society-Lab/resources"]');
    if (githubIcon) {
        githubIcon.parentNode.appendChild(notification);
        setTimeout(() => notification.querySelector('.message').style.opacity = '1', 100);
        setTimeout(() => notification.remove(), 5000);
    }
}

async function fetchMarkdown(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load README file. HTTP status: ${response.status}`);
    }
    return response.text();
}

function filterMarkdown(markdown) {
    return markdown.replace(/<br\s*\/?>/gi, '');
}

function parseMarkdown(filteredMarkdown) {
    return new DOMParser().parseFromString(marked.parse(filteredMarkdown), 'text/html').body;
}

function extractHeadersAndTables(content) {
    const headersAndTables = Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, table'));
    const headerTablePairs = [];
    let currentHeader = null;

    headersAndTables.forEach(element => {
        if (element.tagName.match(/^H[2-6]$/)) {
            currentHeader = element.innerText;
        } else if (element.tagName === 'TABLE' && currentHeader) {
            headerTablePairs.push({ header: currentHeader, table: element });
            currentHeader = null;
        }
    });

    return headerTablePairs;
}

function mergeTables(headerTablePairs) {
    const mergedTable = document.createElement('table');
    const mergedTbody = document.createElement('tbody');
    mergedTable.appendChild(mergedTbody);
    let headerAdded = false;

    headerTablePairs.forEach(({ header, table }) => {
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, rowIndex) => {
            const newRow = row.cloneNode(true);
            if (rowIndex === 0 && !headerAdded) {
                const thead = createTableHeader(newRow, 'Category');
                mergedTable.appendChild(thead);
                headerAdded = true;
            } else if (rowIndex > 0) {
                appendCategoryCell(newRow, header);
                mergedTbody.appendChild(newRow);
            }
        });
    });

    return mergedTable;
}

function createTableHeader(row, categoryText) {
    const headerRow = document.createElement('tr');
    row.childNodes.forEach(cell => headerRow.appendChild(cell.cloneNode(true)));
    const categoryHeader = document.createElement('th');
    categoryHeader.textContent = categoryText;
    headerRow.appendChild(categoryHeader);
    const thead = document.createElement('thead');
    thead.appendChild(headerRow);
    return thead;
}

function appendCategoryCell(row, headerText) {
    const categoryCell       = document.createElement('td');
    categoryCell.textContent = headerText;
    row.appendChild(categoryCell);
}

function initializeDataTables() {
    $('table').DataTable(
        {
            lengthChange: false,
            pageLength: 25,
            language: {
                sSearch: "",
                searchPlaceholder: "🔍 Search",
                zeroRecords: "No matching records found",
                info: "Showing _START_ to _END_ of _TOTAL_ records",
                infoEmpty: "No records available",
                infoFiltered: "(filtered from _MAX_ total records)",
            },
            info: true,
            order: [2, 'asc'],
            ordering: true,
            autoWidth: false,
            responsive: true,
            paging: true,
            columnDefs: [
                {
                    targets: [0, 2],
                    responsivePriority: 1
                }
            ],
        });
}

async function main() {
    const url = 'https://raw.githubusercontent.com/Code-Society-Lab/resources/main/README.md';
    try {
        const markdown         = await fetchMarkdown(url);
        const filteredMarkdown = filterMarkdown(markdown);
        const htmlContent      = parseMarkdown(filteredMarkdown);
        const headerTablePairs = extractHeadersAndTables(htmlContent);

        if (headerTablePairs.length > 0) {
            const mergedTable = mergeTables(headerTablePairs);
            document.getElementById('content').innerHTML = `<div>${mergedTable.outerHTML}</div>`;
            initializeDataTables();
        } else {
            document.getElementById('content').innerHTML = 'No tables found in README file.';
        }
    } catch (error) {
        document.getElementById('content').innerHTML = `Error fetching README file: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupNotification();
    main();
});