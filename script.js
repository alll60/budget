// Budget App JavaScript - English Version

let currentDate = new Date();
let budgetData = loadData();
let pieChart = null;
let barChart = null;

// Chart palette — muted editorial tones that match the terminal aesthetic
const categoryColors = {
    'Housing':        '#c9a46b',  // gold (primary accent)
    'Food':           '#4ea884',  // muted green
    'Transportation': '#7a9cc6',  // dusty blue
    'Utilities':      '#b8946f',  // bronze
    'Entertainment':  '#a67ba8',  // muted plum
    'Healthcare':     '#c66a5a',  // terracotta
    'Shopping':       '#d4a574',  // sand
    'Other':          '#8b8a84'   // stone
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    updateMonthDisplay();
    updateSummary();
    displayExpenses();
    updateCharts();

    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('setIncome').addEventListener('click', setIncome);
    document.getElementById('addExpense').addEventListener('click', addExpense);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', importData);
    document.getElementById('clearMonth').addEventListener('click', clearMonth);

    document.getElementById('incomeAmount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setIncome();
    });

    document.getElementById('expenseAmount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
});

function getMonthKey() {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
}

function updateMonthDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateMonthDisplay();
    updateSummary();
    displayExpenses();
    updateCharts();
}

function setIncome() {
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid income amount');
        return;
    }

    const monthKey = getMonthKey();
    if (!budgetData[monthKey]) {
        budgetData[monthKey] = { income: 0, expenses: [] };
    }

    budgetData[monthKey].income = amount;
    saveData();
    updateSummary();
    updateCharts();
    document.getElementById('incomeAmount').value = '';
}

function addExpense() {
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;

    if (!name) {
        alert('Please enter an expense name');
        return;
    }

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const monthKey = getMonthKey();
    if (!budgetData[monthKey]) {
        budgetData[monthKey] = { income: 0, expenses: [] };
    }

    budgetData[monthKey].expenses.push({
        id: Date.now(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    });

    saveData();
    updateSummary();
    displayExpenses();
    updateCharts();

    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
}

function editExpense(id) {
    const monthKey = getMonthKey();
    if (!budgetData[monthKey]) return;

    const expense = budgetData[monthKey].expenses.find(e => e.id === id);
    if (!expense) return;

    const newName = prompt('New expense name:', expense.name);
    if (newName === null) return;

    const newAmount = prompt('New amount:', expense.amount);
    if (newAmount === null) return;

    const parsedAmount = parseFloat(newAmount);
    if (!parsedAmount || parsedAmount <= 0) {
        alert('Invalid amount');
        return;
    }

    const categories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'];
    const categoryChoice = prompt(
        'Choose a category (enter number):\n' +
        categories.map((cat, i) => `${i + 1}. ${cat}`).join('\n'),
        categories.indexOf(expense.category) + 1
    );

    if (categoryChoice === null) return;

    const categoryIndex = parseInt(categoryChoice) - 1;
    if (categoryIndex < 0 || categoryIndex >= categories.length) {
        alert('Invalid category');
        return;
    }

    expense.name = newName.trim();
    expense.amount = parsedAmount;
    expense.category = categories[categoryIndex];

    saveData();
    updateSummary();
    displayExpenses();
    updateCharts();
}

function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    const monthKey = getMonthKey();
    if (budgetData[monthKey]) {
        budgetData[monthKey].expenses = budgetData[monthKey].expenses.filter(e => e.id !== id);
        saveData();
        updateSummary();
        displayExpenses();
        updateCharts();
    }
}

function displayExpenses() {
    const monthKey = getMonthKey();
    const expensesList = document.getElementById('expensesList');

    if (!budgetData[monthKey] || budgetData[monthKey].expenses.length === 0) {
        expensesList.innerHTML = '<p>No expenses yet</p>';
        return;
    }

    const expenses = budgetData[monthKey].expenses;
    expensesList.innerHTML = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
                <div class="expense-category">${expense.category}</div>
            </div>
            <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
            <button class="edit-btn" onclick="editExpense(${expense.id})">Edit</button>
            <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
        </div>
    `).join('');
}

function updateSummary() {
    const monthKey = getMonthKey();
    const monthData = budgetData[monthKey] || { income: 0, expenses: [] };

    const income = monthData.income;
    const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = income - totalExpenses;

    document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('remaining').textContent = `$${remaining.toFixed(2)}`;

    // Toggle negative class for theme-aware coloring
    const balanceCard = document.querySelector('.balance-card');
    if (balanceCard) {
        balanceCard.classList.toggle('negative', remaining < 0);
    }
}

function updateCharts() {
    const monthKey = getMonthKey();
    const monthData = budgetData[monthKey] || { income: 0, expenses: [] };

    const categoryTotals = {};
    monthData.expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const colors = categories.map(cat => categoryColors[cat] || '#8b8a84');

    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();

    // Shared chart styling for the dark editorial theme
    const gridColor = 'rgba(255, 255, 255, 0.04)';
    const tickColor = '#5a5955';
    const textColor = '#e8e6df';

    // Doughnut chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#11141a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 14,
                        color: textColor,
                        font: {
                            family: 'JetBrains Mono, monospace',
                            size: 11
                        },
                        boxWidth: 10,
                        boxHeight: 10,
                        usePointStyle: false
                    }
                },
                tooltip: {
                    backgroundColor: '#11141a',
                    titleColor: '#c9a46b',
                    bodyColor: '#e8e6df',
                    borderColor: 'rgba(201, 164, 107, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 3,
                    titleFont: { family: 'JetBrains Mono, monospace', size: 10, weight: '500' },
                    bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
                    displayColors: true,
                    boxWidth: 8,
                    boxHeight: 8,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `  ${label}  $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Bar chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Amount Spent',
                data: amounts,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 0,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#11141a',
                    titleColor: '#c9a46b',
                    bodyColor: '#e8e6df',
                    borderColor: 'rgba(201, 164, 107, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 3,
                    titleFont: { family: 'JetBrains Mono, monospace', size: 10, weight: '500' },
                    bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
                    callbacks: {
                        label: function(context) {
                            return `  $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: tickColor,
                        font: { family: 'JetBrains Mono, monospace', size: 10 },
                        maxRotation: 30,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: tickColor,
                        font: { family: 'JetBrains Mono, monospace', size: 10 },
                        callback: function(value) {
                            if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

function clearMonth() {
    if (!confirm('Clear all data for this month? This cannot be undone.')) return;

    const monthKey = getMonthKey();
    delete budgetData[monthKey];
    saveData();
    updateSummary();
    displayExpenses();
    updateCharts();
}

function exportData() {
    const dataStr = JSON.stringify(budgetData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('Import this data? Current data will be replaced.')) {
                budgetData = importedData;
                saveData();
                updateSummary();
                displayExpenses();
                updateCharts();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function saveData() {
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
}

function loadData() {
    const saved = localStorage.getItem('budgetData');
    return saved ? JSON.parse(saved) : {};
}
