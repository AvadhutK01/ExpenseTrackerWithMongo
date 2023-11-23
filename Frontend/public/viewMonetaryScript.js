const divAlert = document.getElementById('div-alert');
let table1 = document.getElementById("table1");
let tablebody1 = document.getElementById("tablebody1");
let table2 = document.getElementById("table2");
let tablebody2 = document.getElementById("tablebody2");
let table3 = document.getElementById("table3");
let tablebody3 = document.getElementById("tablebody3");
let table4 = document.getElementById("table4");
let tablebody4 = document.getElementById("tablebody4");
let table5 = document.getElementById("table5");
let tablebody5 = document.getElementById("tablebody5");
const noDataDayContainer = document.getElementById('noDataDayContainer');
const noDataWeekContainer = document.getElementById('noDataWeekContainer');
const noDataMonthContainer = document.getElementById('noDataMonthContainer');
const noDataYearContainer = document.getElementById('noDataYearContainer');
const noDataUrlContainer = document.getElementById('noDataUrlContainer');
const dailyDataArray = [];
const weeklyDataArray = [];
const monthlyDataArray = [];
const yearlyDataArray = [];
const totalSavingArray = [];
const btnDownload = document.getElementById('btnDownload');
document.addEventListener('DOMContentLoaded', fetchData);

async function fetchData() {
    try {
        const token = localStorage.getItem('token');
        const result = await axios.get('/expense/viewReportExpensesData', {
            headers: {
                "Authorization": token
            }
        });
        const yearlyResult = await axios.get('/expense/viewYearlyExpensesData', {
            headers: {
                "Authorization": token
            }
        });
        const DownloadUrl = await axios.get('/expense/getDownloadUrl', {
            headers: {
                "Authorization": token
            }
        });

        const currentDate = moment();
        const formattedDate = currentDate.format('L');
        const today = moment(formattedDate, 'MM/DD/YYYY');

        const startOfWeek = moment(currentDate).startOf('week');
        const thisMonthStart = moment(currentDate).startOf('month');

        const dailyData = result.data.filter(item => {
            const itemDate = moment(item.date, 'DD/MM/YYYY');
            return itemDate.isSame(today, 'day');
        });

        const weeklyData = result.data.filter(item => {
            const itemDate = moment(item.date, 'DD/MM/YYYY');
            return itemDate.isSameOrAfter(startOfWeek, 'day');
        });

        const monthlyData = result.data.filter(item => {
            const itemDate = moment(item.date, 'DD/MM/YYYY');
            return itemDate.isSameOrAfter(thisMonthStart, 'day');
        });

        const currentYear = moment().year();
        const yearlyData = yearlyResult.data.filter(item => {
            const [itemMonth, itemYear] = item.year.split('-').map(Number);
            return itemYear === currentYear;
        });


        displayData(dailyData, table1, tablebody1, noDataDayContainer, dailyDataArray);
        displayData(weeklyData, table2, tablebody2, noDataWeekContainer, weeklyDataArray);
        displayData(monthlyData, table3, tablebody3, noDataMonthContainer, monthlyDataArray);
        displayYearlyReport(yearlyData, table4, tablebody4, noDataYearContainer, yearlyDataArray);
        displayDownloadUrl(DownloadUrl.data, table5, tablebody5);

    } catch (error) {
        await displayNotification("Internal Server Error!", 'danger', divAlert);
    }

}

async function displayData(data, tablebody, table, container, dataArray) {
    if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            let tr = document.createElement("tr");
            tr.className = 'text-center'
            let td1 = document.createElement("td");
            td1.id = "td1";
            td1.appendChild(document.createTextNode(data[i].date));
            tr.appendChild(td1);
            let td2 = document.createElement("td");
            td2.id = "td2";
            td2.appendChild(document.createTextNode(data[i].Amount.$numberDecimal));
            tr.appendChild(td2);
            let td3 = document.createElement("td");
            td3.id = "td3";
            td3.appendChild(document.createTextNode(data[i].sourceType));
            tr.appendChild(td3);
            let td4 = document.createElement("td");
            td4.id = "td4";
            td4.appendChild(document.createTextNode(data[i].description));
            tr.appendChild(td4);
            let td5 = document.createElement("td");
            td5.id = "td5";
            td5.appendChild(document.createTextNode(data[i].type));
            tr.appendChild(td5);
            tablebody.appendChild(tr);
            dataArray.push({
                date: data[i].date,
                amount: data[i].Amount.$numberDecimal,
                sourceType: data[i].sourceType,
                description: data[i].description,
                type: data[i].type
            });
            container.style.display = 'none';
        }
        flag = false;
    }
    else {
        container.style.display = 'block';
    }

}

async function displayYearlyReport(data, tablebody, table, container, dataArray) {
    const totalDataContainer = document.getElementById('totalDataContainer');
    const totalIncomeValue = document.getElementById('totalIncomeValue');
    const totalExpensesValue = document.getElementById('totalExpensesValue');
    const totalSavingsValue = document.getElementById('totalSavingsValue');
    if (data.length > 0) {
        let totalIncome = 0;
        let totalExpense = 0;
        let savings = 0;
        for (let i = 0; i < data.length; i++) {
            let dateParts = data[i].year.split('-');
            let month = parseInt(dateParts[0], 10);
            let year = parseInt(dateParts[1], 10);
            let formattedDate = new Date(year, month - 1);
            let monthName = formattedDate.toLocaleString('en-US', { month: 'long' });

            let tr = document.createElement("tr");
            tr.className = 'text-center'
            let td1 = document.createElement("td");
            td1.id = "td1";
            td1.appendChild(document.createTextNode(`${monthName} ${year}`));
            tr.appendChild(td1);
            let td2 = document.createElement("td");
            td2.id = "td2";
            td2.appendChild(document.createTextNode(data[i].TotalIncomme.$numberDecimal));
            tr.appendChild(td2);
            let td3 = document.createElement("td");
            td3.id = "td3";
            td3.appendChild(document.createTextNode(data[i].TotalExpense.$numberDecimal));
            tr.appendChild(td3);
            let td4 = document.createElement("td");
            td4.id = "td4";
            td4.appendChild(document.createTextNode(data[i].Savings.$numberDecimal));
            tr.appendChild(td4);
            tablebody.appendChild(tr);
            totalIncome = totalIncome + parseInt(data[i].TotalIncomme.$numberDecimal);
            totalExpense = totalExpense + parseInt(data[i].TotalExpense.$numberDecimal)
            savings += parseInt(data[i].Savings.$numberDecimal);
            dataArray.push({
                monthYear: `${monthName} ${year}`,
                totalIncome: data[i].TotalIncomme.$numberDecimal,
                totalExpense: data[i].TotalExpense.$numberDecimal,
                savings: data[i].Savings.$numberDecimal
            });
        }
        totalSavingArray.push({
            TotalIncome: totalIncome,
            TotalExpense: totalExpense,
            TotalSaving: savings
        });
        container.style.display = 'none';
        totalIncomeValue.textContent = totalIncome;
        totalExpensesValue.textContent = totalExpense;
        totalSavingsValue.textContent = savings;
    }
    else {
        totalDataContainer.style.display = 'none';
        container.style.display = 'block';
    }
}

async function displayDownloadUrl(data, table, tablebody) {
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            let tr = document.createElement("tr");
            tr.className = 'text-center'
            let td = document.createElement("td");
            td.id = "td1";
            td.appendChild(document.createTextNode(i + 1));
            tr.appendChild(td);
            let td1 = document.createElement("td");
            td1.id = "td1";
            td1.appendChild(document.createTextNode(data[i].date));
            tr.appendChild(td1);
            let td2 = document.createElement("td");
            td2.id = "td1";
            td2.appendChild(document.createTextNode(data[i].type));
            tr.appendChild(td2);
            let td3 = document.createElement("td");
            let downloadLink = document.createElement("a");
            downloadLink.href = data[i].fileUrl;
            downloadLink.target = "_blank";
            downloadLink.appendChild(document.createTextNode('Download'));
            td3.appendChild(downloadLink);
            tr.appendChild(td3);
            tablebody.appendChild(tr);
        }
    }
}

btnDownload.addEventListener('click', (e) => {
    $('#downloadModal').modal('show');
    const downloadAllButton = document.getElementById('BtnAllDownload');
    const downloadReportButton = document.getElementById('BtnReportDownload');
    downloadAllButton.addEventListener('click', () => {
        downloadData('All');
        $('#downloadModal').modal('hide');
    });
    downloadReportButton.addEventListener('click', () => {
        downloadData('Report');
        $('#downloadModal').modal('hide');
    });
    const modalCloseButton = document.querySelector('[data-bs-dismiss="modal"]');
    modalCloseButton.addEventListener('click', () => {
        $('#downloadModal').modal('hide');
    });
});


async function downloadData(type) {
    const queryParams = {
        dailyData: dailyDataArray,
        weeklyData: weeklyDataArray,
        monthlyData: monthlyDataArray,
        yearlyData: yearlyDataArray,
        totalSavingData: totalSavingArray,
        downloadType: type
    };

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post('/expense/download', queryParams, {
            headers: {
                "Authorization": token
            }
        });

        var a = document.createElement('a');
        a.href = response.data.fileUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            window.location.reload();
        }, 3000);
    } catch (error) {
        await displayNotification("Internal Server Error!", 'danger', divAlert);
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
