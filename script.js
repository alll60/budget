// Budget Tracker - JavaScript (English)

let currentDate = new Date();
let viewMode = 'monthly'; // 'monthly' or 'yearly'
let budgetData = loadData();
let pieChart = null;
let barChart = null;

const CATEGORIES = ['Housing', 'Food', 'Transportation', 'Utilities',
                    'Entertainment', 'Healthcare', 'Shopping', 'Other'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

// Muted palette tuned for the dark theme (EN + FR names)
const categoryColors = {
    'Housing':        '#D6A96A', 'Logement':       '#D6A96A',
    'Food':           '#6FB79A', 'Nourriture':     '#6FB79A',
    'Transportation': '#6E8FC4', 'Transport':      '#6E8FC4',
    'Utilities':      '#B57BA6', 'Services':       '#B57BA6',
    'Entertainment':  '#C9705C', 'Divertissement': '#C9705C',
    'Healthcare':     '#9AA45C', 'Sant\u00e9':     '#9AA45C',
    'Shopping':       '#8C7BC4', 'Magasinage':     '#8C7BC4',
    'Other':          '#7E8A92', 'Autre':          '#7E8A92'
};

// Match the charts to the dark background
Chart.defaults.color = '#8B8F94';
Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
Chart.defaults.font.size = 12;

document.addEventListener('DOMContentLoaded', function () {
    refreshAll();

    document.getElementById('prevPeriod').addEventListener('click', () => changePeriod(-1));
    document.getElementById('nextPeriod').addEventListener('click', () => changePeriod(1));
    document.getElementById('viewMonthly').addEventListener('click', () => setView('monthly'));
    document.getElementById('viewYearly').addEventListener('click', () => setView('yearly'));
    document.getElementById('setIncome').addEventListener('click', setIncome);
    document.getElementById('addExpense').addEventListener('click', addExpense);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportPDF').addEventListener('click', exportPDF);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', importData);
    document.getElementById('clearMonth').addEventListener('click', clearPeriod);

    document.getElementById('incomeAmount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setIncome();
    });
    document.getElementById('expenseAmount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
});

/* ---------- Helpers ---------- */

function getMonthKey(d = currentDate) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getYearKeys() {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

function money(v) {
    return `$${v.toFixed(2)}`;
}

function getPeriodData() {
    if (viewMode === 'monthly') {
        const d = budgetData[getMonthKey()] || { income: 0, expenses: [] };
        return { income: d.income || 0, expenses: d.expenses || [] };
    }
    let income = 0;
    let expenses = [];
    getYearKeys().forEach(key => {
        const d = budgetData[key];
        if (!d) return;
        income += d.income || 0;
        expenses = expenses.concat((d.expenses || []).map(e => ({ ...e, month: key })));
    });
    return { income, expenses };
}

function isYearly() {
    return viewMode === 'yearly';
}

/* ---------- View / navigation ---------- */

function setView(mode) {
    viewMode = mode;
    document.getElementById('viewMonthly').classList.toggle('active', mode === 'monthly');
    document.getElementById('viewYearly').classList.toggle('active', mode === 'yearly');

    const yearly = isYearly();
    document.getElementById('incomeSection').style.display = yearly ? 'none' : 'block';
    document.getElementById('expenseSection').style.display = yearly ? 'none' : 'block';
    document.getElementById('incomeLabel').textContent = yearly ? 'Yearly Income' : 'Monthly Income';
    document.getElementById('listTitle').innerHTML = yearly
        ? '&#128203; Monthly Summary'
        : '&#128203; Expenses List';
    document.getElementById('barTitle').innerHTML = yearly
        ? 'Expenses by Month'
        : 'Category Breakdown';

    refreshAll();
}

function changePeriod(delta) {
    if (isYearly()) {
        currentDate.setFullYear(currentDate.getFullYear() + delta);
    } else {
        currentDate.setMonth(currentDate.getMonth() + delta);
    }
    refreshAll();
}

function updatePeriodDisplay() {
    const year = currentDate.getFullYear();
    document.getElementById('currentPeriod').textContent = isYearly()
        ? `${year}`
        : `${MONTH_NAMES[currentDate.getMonth()]} ${year}`;
}

function refreshAll() {
    updatePeriodDisplay();
    updateSummary();
    displayExpenses();
    updateCharts();
}

/* ---------- Input ---------- */

function setIncome() {
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid income amount');
        return;
    }
    const monthKey = getMonthKey();
    if (!budgetData[monthKey]) budgetData[monthKey] = { income: 0, expenses: [] };
    budgetData[monthKey].income = amount;
    saveData();
    refreshAll();
    document.getElementById('incomeAmount').value = '';
}

function addExpense() {
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;

    if (!name) { alert('Please enter an expense name'); return; }
    if (!amount || amount <= 0) { alert('Please enter a valid amount'); return; }

    const monthKey = getMonthKey();
    if (!budgetData[monthKey]) budgetData[monthKey] = { income: 0, expenses: [] };

    budgetData[monthKey].expenses.push({
        id: Date.now(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    });

    saveData();
    refreshAll();
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
    if (!parsedAmount || parsedAmount <= 0) { alert('Invalid amount'); return; }

    const categoryChoice = prompt(
        'Choose a category (enter number):\n' +
        CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join('\n'),
        CATEGORIES.indexOf(expense.category) + 1
    );
    if (categoryChoice === null) return;

    const categoryIndex = parseInt(categoryChoice) - 1;
    if (categoryIndex < 0 || categoryIndex >= CATEGORIES.length) { alert('Invalid category'); return; }

    expense.name = newName.trim();
    expense.amount = parsedAmount;
    expense.category = CATEGORIES[categoryIndex];

    saveData();
    refreshAll();
}

function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    const monthKey = getMonthKey();
    if (budgetData[monthKey]) {
        budgetData[monthKey].expenses = budgetData[monthKey].expenses.filter(e => e.id !== id);
        saveData();
        refreshAll();
    }
}

/* ---------- Display ---------- */

function displayExpenses() {
    const expensesList = document.getElementById('expensesList');
    const { expenses } = getPeriodData();

    if (expenses.length === 0) {
        expensesList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No expenses yet</p>';
        return;
    }

    if (isYearly()) {
        const rows = getYearKeys().map((key, i) => {
            const d = budgetData[key];
            if (!d) return null;
            const total = (d.expenses || []).reduce((s, e) => s + e.amount, 0);
            const income = d.income || 0;
            if (total === 0 && income === 0) return null;
            const balance = income - total;
            return `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-name">${MONTH_NAMES[i]}</div>
                        <div class="expense-category">Income: ${money(income)} &bull; Balance: ${money(balance)}</div>
                    </div>
                    <span class="expense-amount">${money(total)}</span>
                </div>`;
        }).filter(Boolean);
        expensesList.innerHTML = rows.join('');
        return;
    }

    expensesList.innerHTML = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
                <div class="expense-category">${expense.category}</div>
            </div>
            <span class="expense-amount">${money(expense.amount)}</span>
            <button class="edit-btn" onclick="editExpense(${expense.id})">Edit</button>
            <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
        </div>
    `).join('');
}

function updateSummary() {
    const { income, expenses } = getPeriodData();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = income - totalExpenses;

    document.getElementById('totalIncome').textContent = money(income);
    document.getElementById('totalExpenses').textContent = money(totalExpenses);
    document.getElementById('remaining').textContent = money(remaining);

    const remainingCard = document.querySelector('.balance-card');
    remainingCard.classList.toggle('negative', remaining < 0);
}

function getCategoryTotals() {
    const { expenses } = getPeriodData();
    const totals = {};
    expenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
}

function updateCharts() {
    const categoryTotals = getCategoryTotals();
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const colors = categories.map(cat => categoryColors[cat] || '#7E8A92');

    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();

    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{ data: amounts, backgroundColor: colors, borderWidth: 2, borderColor: '#0E0F11' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${money(value)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    let barLabels, barValues, barColors;
    if (isYearly()) {
        barLabels = MONTH_NAMES.map(m => m.substring(0, 3));
        barValues = getYearKeys().map(key => {
            const d = budgetData[key];
            return d ? (d.expenses || []).reduce((s, e) => s + e.amount, 0) : 0;
        });
        barColors = barValues.map(() => '#D6A96A');
    } else {
        barLabels = categories;
        barValues = amounts;
        barColors = colors;
    }

    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Amount Spent',
                data: barValues,
                backgroundColor: barColors,
                borderColor: barColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => money(c.parsed.y) } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#1F2327' }, ticks: { callback: (v) => '$' + v.toFixed(0) } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* ---------- Clear ---------- */

function clearPeriod() {
    if (isYearly()) {
        if (!confirm(`Clear all data for ${currentDate.getFullYear()}? This cannot be undone.`)) return;
        getYearKeys().forEach(key => delete budgetData[key]);
    } else {
        if (!confirm('Clear all data for this month? This cannot be undone.')) return;
        delete budgetData[getMonthKey()];
    }
    saveData();
    refreshAll();
}

/* ---------- Exports ---------- */

function periodLabel() {
    return isYearly()
        ? `${currentDate.getFullYear()}`
        : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function periodSlug() {
    return isYearly() ? `${currentDate.getFullYear()}` : getMonthKey();
}

function exportCSV() {
    const { income, expenses } = getPeriodData();
    if (expenses.length === 0 && income === 0) {
        alert('No data to export for this period');
        return;
    }

    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [];

    lines.push(esc('Period') + ',' + esc(periodLabel()));
    lines.push('');
    lines.push(['Month', 'Name', 'Category', 'Amount'].map(esc).join(','));

    if (isYearly()) {
        expenses.forEach(e => {
            const idx = parseInt(e.month.split('-')[1], 10) - 1;
            lines.push([MONTH_NAMES[idx], e.name, e.category, e.amount.toFixed(2)].map(esc).join(','));
        });
    } else {
        expenses.forEach(e => {
            lines.push([periodLabel(), e.name, e.category, e.amount.toFixed(2)].map(esc).join(','));
        });
    }

    const totals = getCategoryTotals();
    lines.push('');
    lines.push(['Category', 'Total'].map(esc).join(','));
    Object.entries(totals).forEach(([cat, tot]) => {
        lines.push([cat, tot.toFixed(2)].map(esc).join(','));
    });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    lines.push('');
    lines.push([esc('Income'), esc(income.toFixed(2))].join(','));
    lines.push([esc('Expenses'), esc(totalExpenses.toFixed(2))].join(','));
    lines.push([esc('Remaining'), esc((income - totalExpenses).toFixed(2))].join(','));

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `budget-${periodSlug()}.csv`);
}

function exportPDF() {
    const { income, expenses } = getPeriodData();
    if (expenses.length === 0 && income === 0) {
        alert('No data to export for this period');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const remaining = income - totalExpenses;

    let y = 20;
    doc.setFontSize(18);
    doc.text('Budget Tracker', 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(periodLabel(), 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Income: ${money(income)}`, 14, y); y += 6;
    doc.text(`Expenses: ${money(totalExpenses)}`, 14, y); y += 6;
    doc.text(`Remaining: ${money(remaining)}`, 14, y); y += 10;

    doc.setFontSize(13);
    doc.text('By category', 14, y); y += 7;
    doc.setFontSize(10);
    Object.entries(getCategoryTotals()).forEach(([cat, tot]) => {
        const pct = totalExpenses ? ((tot / totalExpenses) * 100).toFixed(1) : '0.0';
        doc.text(`${cat}`, 16, y);
        doc.text(`${money(tot)}  (${pct}%)`, 120, y);
        y += 6;
        if (y > 275) { doc.addPage(); y = 20; }
    });

    y += 6;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text(isYearly() ? 'Monthly detail' : 'Expense detail', 14, y);
    y += 7;
    doc.setFontSize(10);

    if (isYearly()) {
        getYearKeys().forEach((key, i) => {
            const d = budgetData[key];
            if (!d) return;
            const tot = (d.expenses || []).reduce((s, e) => s + e.amount, 0);
            if (tot === 0 && !(d.income)) return;
            doc.text(MONTH_NAMES[i], 16, y);
            doc.text(`Income ${money(d.income || 0)}`, 70, y);
            doc.text(`Expenses ${money(tot)}`, 130, y);
            y += 6;
            if (y > 275) { doc.addPage(); y = 20; }
        });
    } else {
        expenses.forEach(e => {
            doc.text(e.name.substring(0, 30), 16, y);
            doc.text(e.category, 90, y);
            doc.text(money(e.amount), 150, y);
            y += 6;
            if (y > 275) { doc.addPage(); y = 20; }
        });
    }

    doc.save(`budget-${periodSlug()}.pdf`);
}

function exportData() {
    const dataStr = JSON.stringify(budgetData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    downloadBlob(blob, `budget-data-${new Date().toISOString().split('T')[0]}.json`);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('Import this data? Current data will be replaced.')) {
                budgetData = importedData;
                saveData();
                refreshAll();
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
    localStorage.setItem('budgetData_en', JSON.stringify(budgetData));
}

function loadData() {
    const saved = localStorage.getItem('budgetData_en');
    return saved ? JSON.parse(saved) : {};
}
