let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function addExpense() {

    const name = document.getElementById("expenseName").value.trim();
    const amount = document.getElementById("expenseAmount").value;
    const category = document.getElementById("expenseCategory").value;

    if (name === "" || amount === "" || category === "") {
        alert("Please fill all fields.");
        return;
    }

    if (Number(amount) <= 0) {
        alert("Amount must be greater than 0.");
        return;
    }

    const expense = {
        id: Date.now(),
        name: name,
        amount: Number(amount),
        category: category
    };

    expenses.push(expense);

    saveExpenses();

    displayExpenses();

    clearForm();
}


function displayExpenses() {

    const expenseList = document.getElementById("expenseList");

    expenseList.innerHTML = "";

    if (expenses.length === 0) {

        expenseList.innerHTML = `
            <p class="empty-message">
                No expenses added yet.
            </p>
        `;

        updateTotal();

        return;
    }

    expenses.forEach(function(expense) {

        const expenseItem = document.createElement("div");

        expenseItem.className = "expense-item";

        expenseItem.innerHTML = `
            <div class="expense-details">
                <h3>${expense.name}</h3>
                <p>${expense.category}</p>
            </div>

            <div class="expense-right">

                <div class="amount">
                    ₹${expense.amount}
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteExpense(${expense.id})">
                    Delete
                </button>

            </div>
        `;

        expenseList.appendChild(expenseItem);
    });

    updateTotal();
}


function deleteExpense(id) {

    expenses = expenses.filter(function(expense) {
        return expense.id !== id;
    });

    saveExpenses();

    displayExpenses();
}


function updateTotal() {

    const total = expenses.reduce(function(sum, expense) {
        return sum + expense.amount;
    }, 0);

    document.getElementById("totalExpense").textContent =
        `₹${total}`;
}


function saveExpenses() {

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );
}


function clearForm() {

    document.getElementById("expenseName").value = "";

    document.getElementById("expenseAmount").value = "";

    document.getElementById("expenseCategory").value = "";
}


// Load saved expenses when page opens
displayExpenses();