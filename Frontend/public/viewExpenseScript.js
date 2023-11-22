const divAlert = document.getElementById('div-alert');
let tabel = document.getElementById("table");
let tabelbody = document.getElementById("tablebody");
const PaginationDiv = document.getElementById('paginationDiv');
const rowsPerPageSelect = document.getElementById("rowsPerPage");
let rowsPerPage = localStorage.getItem('rowsperpage') != null ? localStorage.getItem('rowsperpage') : 5;
document.addEventListener('DOMContentLoaded', () => {
    rowsPerPageSelect.addEventListener("change", function () {
        rowsPerPage = parseInt(rowsPerPageSelect.value);
        localStorage.setItem('rowsperpage', rowsPerPage)
        fetchData(rowsPerPage, 1);
    });
    rowsPerPageSelect.value = rowsPerPage;
    fetchData(rowsPerPage, 1);
});
async function fetchData(rowsPerPage, page) {
    try {
        const token = localStorage.getItem('token');
        const result = await axios.get(`/expense/viewExpensesData?page=${page}&rows=${rowsPerPage}`, {
            headers: {
                "Authorization": token
            }
        });
        displayData(result.data.result)
        showPagination(result.data);
    } catch (error) {
        await displayNotification('Internal Server Error', 'danger', divAlert);
    }
}

async function displayData(data) {
    tabelbody.innerText = "";
    if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            let tr = document.createElement("tr");
            tr.setAttribute("data-id", data[i].id);
            let td1 = document.createElement("td");
            td1.id = "td1";
            td1.appendChild(document.createTextNode(data[i].Amount));
            tr.appendChild(td1);
            let td2 = document.createElement("td");
            td2.id = "td2";
            td2.appendChild(document.createTextNode(data[i].sourceType));
            tr.appendChild(td2);
            let td3 = document.createElement("td");
            td3.id = "td3";
            td3.appendChild(document.createTextNode(data[i].description));
            tr.appendChild(td3);
            let td4 = document.createElement("td");
            td4.id = "td4";
            td4.appendChild(document.createTextNode(data[i].type));
            tr.appendChild(td4);
            let td5 = document.createElement("td");
            var delbutton = document.createElement('button');
            delbutton.className = "btn btn-danger btn-sm float-right m-0 delete";
            delbutton.addEventListener('click', () => {
                deleteData(data[i].id, data[i].Amount, data[i].type);
            });
            delbutton.appendChild(document.createTextNode("Delete"));
            let td6 = document.createElement("td");
            var Editbutton = document.createElement('button');
            Editbutton.className = "btn mr-1 btn-info btn-sm float-right ms-2 edit";
            Editbutton.addEventListener('click', () => {
                setUpdate(data[i]);
            })
            Editbutton.appendChild(document.createTextNode("Edit"));
            td5.appendChild(Editbutton);
            td6.appendChild(delbutton);
            tr.appendChild(td5);
            tr.appendChild(td6);
            tabelbody.appendChild(tr);
        }
    }
    else {
        tabel.innerHTML = "<h5>No Data Found</h5>";
    }
}

async function deleteData(id, Amount, Etype) {
    const token = localStorage.getItem('token');
    const isConfirmed = confirm('Are you sure you want to delete this data?');
    if (isConfirmed) {
        try {
            await axios.post(`/expense/deleteExpensedata`,
                { id, Amount, Etype },
                {
                    headers: {
                        "Authorization": token
                    }
                }
            );
            window.location.href = '/expense/viewExpenses';
        } catch (error) {
            await displayNotification('Internal Server Error', 'danger', divAlert);
        }
    }
}


async function setUpdate(data) {
    localStorage.setItem('updateData', JSON.stringify(data));
    window.location.href = '/expense/expenseMain';
}

function showPagination({
    currentPage,
    hasNextPage,
    nextPage,
    hasPreviousPage,
    previousPage,
    lastPage,
}) {
    PaginationDiv.innerHTML = '';
    if (hasPreviousPage) {
        const btn2 = document.createElement('button');
        btn2.innerHTML = previousPage;
        btn2.addEventListener('click', () => (fetchData(rowsPerPage, previousPage)));
        PaginationDiv.appendChild(btn2)
    }
    const btn1 = document.createElement('button');
    btn1.innerHTML = `${currentPage}`;
    btn1.addEventListener('click', () => (fetchData(rowsPerPage, currentPage)));
    PaginationDiv.appendChild(btn1);
    if (hasNextPage) {
        const btn3 = document.createElement('button');
        btn3.innerHTML = nextPage;
        btn3.addEventListener('click', () => (fetchData(rowsPerPage, nextPage)));
        PaginationDiv.appendChild(btn3)
    }
}

function displayNotification(message, type, container) {
    return new Promise((resolve) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `alert alert-${type}`;
        notificationDiv.textContent = message;
        container.appendChild(notificationDiv);
        setTimeout(() => {
            notificationDiv.remove();
            resolve();
        }, 2000);
    });
}