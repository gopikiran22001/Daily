document.addEventListener("DOMContentLoaded", function () {
    const balanceDisplay = document.getElementById("balance");
    const expenseList = document.getElementById("expense-list");
    const analyticsList = document.getElementById("analytics-list");
    const analyticsChartCanvas = document.getElementById("analyticsChart");

    let analyticsChart;

    const transactionsTab = document.getElementById("transactions-tab");
    const savingsTab = document.getElementById("savings-tab");
    const analyticsTab = document.getElementById("salary-tab");
    analyticsTab.innerText = "📊 Analytics";

    const transactionsSection = document.getElementById("transactions-section");
    const savingsSection = document.getElementById("savings-section");
    const analyticsSection = document.getElementById("analytics-section");

    const transactionTypeInput = document.getElementById("transaction-type");
    const amountInput = document.getElementById("amount");
    const descriptionInput = document.getElementById("description");
    const categoryInput = document.getElementById("category");
    const dateInput = document.getElementById("transaction-date");

    const addTransactionBtn = document.getElementById("add-transaction");

    let balance = localStorage.getItem("balance") ? parseFloat(localStorage.getItem("balance")) : 0;
    balanceDisplay.innerText = `₹${balance.toFixed(2)}`;  // Changed $ to ₹

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let savingsGoals = JSON.parse(localStorage.getItem("savingsGoals")) || [];

    function updateBalance(amount) {
        balance += amount;
        localStorage.setItem("balance", balance);
        balanceDisplay.innerText = `₹${balance.toFixed(2)}`;  // Changed $ to ₹
    }

    function calculateTotalExpensesByCategory() {
        const categoryExpenses = {};
        transactions.forEach(transaction => {
            if (transaction.type === "expense") {
                const categoryKey = transaction.category.toLowerCase();
                categoryExpenses[categoryKey] = (categoryExpenses[categoryKey] || 0) + transaction.amount;
            }
        });
        return categoryExpenses;
    }

    function updateSavingsDisplay() {
        const goalList = document.getElementById("goal-list");
        goalList.innerHTML = "";

        const categoryExpenses = calculateTotalExpensesByCategory();

        savingsGoals.forEach((goal, index) => {
            let spent = categoryExpenses[goal.name.toLowerCase()] || 0;
            let savedAmount = Math.max(goal.target - spent, 0);
            savingsGoals[index].saved = savedAmount;
        });

        localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));

        savingsGoals.forEach((goal, index) => {
            let goalItem = document.createElement("div");
            goalItem.classList.add("transaction-card");
            goalItem.innerHTML = `
                <strong>🎯 ${goal.name}</strong><br>
                <span class="goal-amount">Target: <b>₹${goal.target.toFixed(2)}</b></span><br>
                <span class="goal-progress">Saved: <b class="saved-amount" style="color:green;">₹${goal.saved.toFixed(2)}</b></span><br>
                <button class="delete-btn" data-index="${index}">🗑️</button>
            `;

            goalList.appendChild(goalItem);

            const deleteBtn = goalItem.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", function () {
                savingsGoals.splice(index, 1);
                localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
                updateSavingsDisplay();
            });
        });
    }

    function updateAnalytics() {
        analyticsList.innerHTML = "";
        const expenseData = calculateTotalExpensesByCategory();

        const labels = Object.keys(expenseData);
        const dataValues = Object.values(expenseData);
        const colors = labels.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`);

        if (analyticsChart) {
            analyticsChart.destroy();
        }

        analyticsChart = new Chart(analyticsChartCanvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    label: "Expenses by Category",
                    data: dataValues,
                    backgroundColor: colors,
                }]
            }
        });
    }

    function updateTransactions() {
        expenseList.innerHTML = "";

        transactions.slice().reverse().forEach((transaction, index) => {
            const transactionItem = document.createElement("div");
            transactionItem.classList.add("transaction-card");
            transactionItem.innerHTML = `
                <strong>${transaction.type === "expense" ? "Expense" : "Salary"} (${transaction.category}):</strong> 
                ${transaction.description} <br>
                <small>📅 ${transaction.date || "N/A"}</small>
                <span class="${transaction.type === "expense" ? "expense-amount" : "salary-amount"}">
                    ${transaction.type === "expense" ? "-₹" : "+₹"}${transaction.amount.toFixed(2)}
                </span>
                <button class="delete-btn" data-index="${index}">🗑️</button>
            `;

            transactionItem.querySelector(".delete-btn").addEventListener("click", function () {
                let originalIndex = transactions.length - 1 - index;
                let removedTransaction = transactions.splice(originalIndex, 1)[0];
                localStorage.setItem("transactions", JSON.stringify(transactions));

                if (removedTransaction.type === "expense") {
                    updateBalance(removedTransaction.amount);
                } else {
                    updateBalance(-removedTransaction.amount);
                }

                updateTransactions();
                updateAnalytics();
                updateSavingsDisplay();
            });

            expenseList.appendChild(transactionItem);
        });

        updateSavingsDisplay();
    }

    addTransactionBtn.addEventListener("click", function () {
        const type = transactionTypeInput.value;
        const amount = parseFloat(amountInput.value);
        const category = categoryInput.value.trim();
        const description = descriptionInput.value.trim();
        const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0]; 

        if (!amount || !description || !category) {
            alert("Please fill all fields!");
            return;
        }

        const transaction = { type, amount, category: category.toLowerCase(), description, date };

        transactions.push(transaction);
        localStorage.setItem("transactions", JSON.stringify(transactions));

        updateBalance(type === "expense" ? -amount : amount);
        updateTransactions();
        updateAnalytics();
        updateSavingsDisplay();

        amountInput.value = "";
        descriptionInput.value = "";
        if (dateInput) dateInput.value = "";
    });

    const addGoalBtn = document.getElementById("add-goal");
    const goalNameInput = document.getElementById("goal-name");
    const goalAmountInput = document.getElementById("goal-amount");

    addGoalBtn.addEventListener("click", function () {
        const goalName = goalNameInput.value.trim().toLowerCase();
        const goalAmount = parseFloat(goalAmountInput.value);

        if (!goalName || isNaN(goalAmount) || goalAmount <= 0) {
            alert("Please enter a valid goal name and amount!");
            return;
        }

        savingsGoals.push({ name: goalName, target: goalAmount, saved: 0 });
        localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
        updateSavingsDisplay();

        goalNameInput.value = "";
        goalAmountInput.value = "";
    });

    transactionsTab.onclick = () => toggleTab(transactionsSection);
    savingsTab.onclick = () => toggleTab(savingsSection);
    analyticsTab.onclick = () => {
        toggleTab(analyticsSection);
        updateAnalytics();
    };

    function toggleTab(activeSection) {
        [transactionsSection, savingsSection, analyticsSection].forEach(section => {
            section.style.display = section === activeSection ? "block" : "none";
        });
    }

    updateTransactions();
    updateAnalytics();
    updateSavingsDisplay();
});
