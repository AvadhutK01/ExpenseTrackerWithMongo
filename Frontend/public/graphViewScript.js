const divAlert = document.getElementById('div-alert');
const GraphDiv = document.getElementById('GraphDiv');
const HeadingDiv = document.getElementById('HeadingDiv');
const btnShowExpenseGraph = document.getElementById('btnShowExpenseGraph');
const btnShowIncomeGraph = document.getElementById('btnShowIncomeGraph');
document.addEventListener('DOMContentLoaded', fetchData('Expense'));
async function fetchData(Type) {
    try {
        const token = localStorage.getItem('token');
        const result = await axios.get('/expense/viewReportExpensesData', {
            headers: {
                "Authorization": token
            }
        });
        const currentDate = new Date();
        const thisMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const monthlyData = result.data.filter(item => {
            const [itemDay, itemMonth, itemYear] = item.date.split('/');
            const itemDate = new Date(`${itemYear}/${itemMonth}/${itemDay}`);
            return itemDate >= thisMonthStart;
        });
        const resultArray = formatData(monthlyData, Type)
        displayGraph(resultArray, Type);

    } catch (error) {
        await displayNotification("Internal Server Error!", 'danger', divAlert);
    }

}

function formatData(data, Type) {
    const sumBySourceType = {};

    data.forEach(item => {
        const { Amount, sourceType, type } = item;
        const amount = parseInt(Amount.$numberDecimal);
        if (type === Type) {
            if (sumBySourceType[sourceType]) {
                sumBySourceType[sourceType] += amount;
            } else {
                sumBySourceType[sourceType] = amount;
            }
        }
    });

    const resultArray = Object.entries(sumBySourceType).map(([sourceType, sum]) => {
        return { sourceType, Amount: sum.toString() };
    });
    return resultArray
}


if (btnShowExpenseGraph) {
    btnShowExpenseGraph.addEventListener("click", function () {
        fetchData("Expense")
    });
}

if (btnShowIncomeGraph) {
    btnShowIncomeGraph.addEventListener("click", function () {
        fetchData("Income");
    });
}

function displayGraph(data, type) {
    const labels = data.map(item => item.sourceType);
    const amounts = data.map(item => parseInt(item.Amount));

    const ctx = document.createElement('canvas');
    HeadingDiv.innerHTML = '';
    GraphDiv.innerHTML = '';
    HeadingDiv.className = 'text-center mt-5 mb-3'
    HeadingDiv.innerHTML = `<h5>${type} Graph of Current Month</h5>`;
    GraphDiv.appendChild(ctx);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    fontColor: 'black',
                    fontSize: 14,
                    padding: 10
                }
            },
            plugins: {
                datalabels: {
                    color: 'white',
                    formatter: (value, context) => {
                        return context.chart.data.labels[context.dataIndex] + '\n' + value;
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 2
                }
            }
        }
    });
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



