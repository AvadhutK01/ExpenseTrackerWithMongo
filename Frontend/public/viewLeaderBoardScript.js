const divAlert = document.getElementById('div-alert');
let tabel = document.getElementById("table");
let tabelbody = document.getElementById("tablebody");
document.addEventListener('DOMContentLoaded', fetchData());

async function fetchData() {
    try {
        const result = await axios.get('/expense/viewLeaderBoardData');
        displayData(result.data)
    } catch (error) {
        await displayNotification('Internal Server Error', 'danger', divAlert);
    }
}


async function displayData(data) {
    tabelbody.innerText = "";
    if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.id = "td";
            td.appendChild(document.createTextNode(i + 1));
            tr.appendChild(td);
            let td1 = document.createElement("td");
            td1.id = "td1";
            td1.appendChild(document.createTextNode(data[i].name));
            tr.appendChild(td1);
            let td2 = document.createElement("td");
            td2.id = "td2";
            td2.appendChild(document.createTextNode(data[i].totalExpense));
            tr.appendChild(td2);
            let td3 = document.createElement("td");
            td3.id = "td3";
            td3.appendChild(document.createTextNode(data[i].totalIncome));
            tr.appendChild(td3);
            let td4 = document.createElement("td");
            td4.id = "td4";
            td4.appendChild(document.createTextNode(data[i].Savings));
            tr.appendChild(td4);
            tabelbody.appendChild(tr);
        }
    } else {
        tabel.innerHTML = "<h5>No Data Found</h5>";
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