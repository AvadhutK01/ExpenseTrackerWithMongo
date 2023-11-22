const Dataform = document.getElementById('AddDataForm');
const updateData1 = JSON.parse(localStorage.getItem('updateData'));
const Amount = document.getElementById('Amount');
const Desc = document.getElementById('Desc');
const Type = document.getElementById('Type');
const divAlert = document.getElementById('div-alert');
if (updateData1) {
    if (updateData1.type === 'Expense') {
        let btnExpenseSubmit = document.getElementById('btnExpenseSubmit');
        btnExpenseSubmit.textContent = 'Update';
    }
    else if (updateData1.type === 'Income') {
        let btnIncomeSubmit = document.getElementById('btnIncomeSubmit');
        btnIncomeSubmit.textContent = 'Update';
    }
    Amount.value = updateData1.Amount;
    Desc.value = updateData1.description;
    Type.value = updateData1.sourceType;
}
Dataform.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (updateData1) {
        try {
            const Amount = document.getElementById('Amount');
            const Desc = document.getElementById('Desc');
            const Type = document.getElementById('Type');
            const data = {
                Amount: Amount.value,
                Desc: Desc.value,
                Type: Type.value,
            };
            const token = localStorage.getItem('token');
            const id = updateData1.id;
            const Etype = updateData1.type
            let response = await axios.post('/expense/update-expense', { Etype, id, data }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            });
            const result = response.data;
            await displayNotification(result.message, 'success', divAlert);
            localStorage.removeItem('updateData');
            window.location = '/expense/expenseMain';
        } catch (error) {
            console.log(error)
            await displayNotification('Internal Server Error!', 'danger', divAlert)
        }
    } else {
        let btnExpenseSubmit = document.getElementById('btnExpenseSubmit');
        let btnIncomeSubmit = document.getElementById('btnIncomeSubmit');
        if (btnExpenseSubmit) {
            addData('Expense');
        }
        if (btnIncomeSubmit) {
            addData('Income');
        }
    }
});

async function addData(type) {
    try {
        const Amount = document.getElementById('Amount');
        const Desc = document.getElementById('Desc');
        const Type = document.getElementById('Type');
        const data = {
            Amount: Amount.value,
            Desc: Desc.value,
            Type: Type.value,
            Etype: type
        };
        const token = localStorage.getItem('token');
        let response = await axios.post('/expense/post-expense', data, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            }
        });
        const result = response.data;
        await displayNotification(result.message, 'success', divAlert);
        window.location = '/expense/expenseMain';
    }
    catch (err) {
        console.error(err);
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
