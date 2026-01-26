// Budget App JavaScript

let currentDate = new Date();
let budgetData = loadData();
let pieChart = null;
let barChart = null;

// Category colors for charts
const categoryColors = {
    'Housing': '#FF6384',
    'Food': '#36A2EB',
    'Transportation': '#FFCE56',
    'Utilities': '#4BC0C0',
    'Entertainment': '#9966FF',
    'Healthcare': '#FF9F40',
    'Shopping': '#FF6384',
    'Other': '#C9CBCF'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    updateMonthDisplay();
    updateSummary();
    displayExpenses();
    updateCharts();
    
    // Event listeners
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('setIncome').addEventListener('click', setIncome);
    document.getElementById('addExpense').addEventListener('click', addExpense);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', importData);
    document.getElementById('clearMonth').addEventListener('click', clearMonth);
    
    // Enter key support
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
    
    // Clear inputs
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
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
        expensesList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No expenses yet</p>';
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
    
    // Change color based on remaining balance
    const remainingCard = document.querySelector('.balance-card');
    if (remaining < 0) {
        remainingCard.style.background = 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)';
    } else {
        remainingCard.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
}

function updateCharts() {
    const monthKey = getMonthKey();
    const monthData = budgetData[monthKey] || { income: 0, expenses: [] };
    
    // Group expenses by category
    const categoryTotals = {};
    monthData.expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const colors = categories.map(cat => categoryColors[cat]);
    
    // Destroy existing charts
    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    
    // Create pie chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Create bar chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Amount Spent',
                data: amounts,
                backgroundColor: colors,
                borderColor: colors.map(c => c),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
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
    event.target.value = ''; // Reset file input
}

function saveData() {
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
}

function loadData() {
    const saved = localStorage.getItem('budgetData');
    return saved ? JSON.parse(saved) : {};
}
