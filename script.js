// Get DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const expenseChartCanvas = document.getElementById('expense-chart');
const showExpensesBtn = document.getElementById('show-expenses-btn');
const showChartBtn = document.getElementById('show-chart-btn');
const exportExpensesBtn = document.getElementById('export-expenses-btn');
const expenseSection = document.getElementById('expense-section');
const chartSection = document.getElementById('chart-section');
const setTodayButton = document.getElementById('set-today');
const expenseDateInput = document.getElementById('expense-date');
const filterDateInput = document.getElementById('filter-date');
const filterMonthInput = document.getElementById('filter-month');
const inputCurrencySelect = document.getElementById('input-currency');
const outputCurrencySelect = document.getElementById('currency');
const convertedAmountDisplay = document.getElementById('converted-amount');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const expenseNote = document.getElementById('expense-note');
const creditsTitle = document.getElementById('credits-title');
const debitsTitle = document.getElementById('debits-title');

// Local storage key
const STORAGE_KEY = 'expenses';

// Load expenses from LocalStorage
let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Today Button Fix
setTodayButton.addEventListener('click', () => {
    expenseDateInput.value = new Date().toISOString().split('T')[0];
});

// Show Expenses Button Fix
showExpensesBtn.addEventListener('click', () => {
    toggleVisibility(expenseSection);
    renderExpenses();
});

// Show Chart Button Fix
showChartBtn.addEventListener('click', () => {
    toggleVisibility(chartSection);
    renderChart();
});

// Function to toggle visibility
function toggleVisibility(section) {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    section.classList.remove('hidden');
}

// Fix Currency Conversion
const API_KEY = '463f449c346ae3c798d9b976';
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/`;
async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (!amount || isNaN(amount) || !fromCurrency || !toCurrency) return;
    try {
        const response = await fetch(`${BASE_URL}${fromCurrency}/${toCurrency}`);
        const data = await response.json();
        if (data.result !== 'success') {
            throw new Error('Invalid conversion rates');
        }
        const convertedAmount = (amount * data.conversion_rate).toFixed(2);
        convertedAmountDisplay.innerText = `Converted: ${toCurrency} ${convertedAmount}`;
    } catch (error) {
        console.error('Currency conversion error:', error);
        convertedAmountDisplay.innerText = 'Conversion failed';
    }
}

// Update conversion when input changes
expenseAmountInput.addEventListener('input', () => convertCurrency(parseFloat(expenseAmountInput.value), inputCurrencySelect.value, outputCurrencySelect.value));
inputCurrencySelect.addEventListener('change', () => convertCurrency(parseFloat(expenseAmountInput.value), inputCurrencySelect.value, outputCurrencySelect.value));
outputCurrencySelect.addEventListener('change', () => convertCurrency(parseFloat(expenseAmountInput.value), inputCurrencySelect.value, outputCurrencySelect.value));

// Function to render expenses
function renderExpenses() {
    expenseList.innerHTML = '';
    expenses.forEach((expense, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>${expense.name} - ₹${expense.amount} (${expense.date})</strong>
            <span>Category: ${expense.category}</span>
            <span>Note: ${expense.note || 'N/A'}</span>
            <button onclick="deleteExpense(${index})">Delete</button>
        `;
        listItem.style.borderLeft = `5px solid ${
            expense.category === 'Food' ? '#ff6384' :
            expense.category === 'Travel' ? '#36a2eb' :
            '#cc65fe'
        }`;
        expenseList.appendChild(listItem);
    });
    renderChart();
}

// Function to render chart
let expenseChart;
function renderChart() {
    if (expenseChart) expenseChart.destroy();
    const totals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});
    expenseChart = new Chart(expenseChartCanvas, {
        type: 'pie',
        data: {
            labels: Object.keys(totals),
            datasets: [{ data: Object.values(totals), backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe'] }]
        }
    });
}

// Function to export expenses
// exportExpensesBtn.addEventListener('click', () => {
//     const dataStr = JSON.stringify(expenses, null, 2);
//     const blob = new Blob([dataStr], { type: 'application/json' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = 'expenses.json';
//     link.click();
// });
exportExpensesBtn.addEventListener('click', () => {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <p>Select Export Format:</p>
        <button id="export-json">JSON</button>
        <button id="export-csv">CSV</button>
        <button id="export-pdf">PDF</button>
        <button id="cancel-export">Cancel</button>
    `;
    document.body.appendChild(popup);
    
    document.getElementById('export-json').addEventListener('click', () => exportFile('json'));
    document.getElementById('export-csv').addEventListener('click', () => exportFile('csv'));
    document.getElementById('export-pdf').addEventListener('click', () => exportFile('pdf'));
    document.getElementById('cancel-export').addEventListener('click', () => popup.remove());
});

function exportFile(type) {
    let dataStr;
    if (type === 'json') {
        dataStr = JSON.stringify(expenses, null, 2);
    } else if (type === 'csv') {
        dataStr = "Name,Amount,Date,Category,Note\n";
        dataStr += expenses.map(exp => `${exp.name},${exp.amount},${exp.date},${exp.category},${exp.note || ''}`).join('\n');
    } else if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Expense Report", 10, 10);
        let y = 20;
        expenses.forEach(exp => {
            doc.text(`${exp.name} - ₹${exp.amount} (${exp.date})`, 10, y);
            doc.text(`Category: ${exp.category} | Note: ${exp.note || 'N/A'}`, 10, y + 10);
            y += 20;
        });

        doc.save('expenses.pdf');
        document.querySelector('.popup').remove();
        return;
    }

    const blob = new Blob([dataStr], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses.${type}`;
    link.click();
    document.querySelector('.popup').remove();
}


// Delete an expense
function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    renderExpenses();
    showMessage('Expense deleted successfully!');
}


// Credit & Debit Buttons Fix
creditsTitle.addEventListener('click', () => {
    const creditAmount = prompt("Enter the credited amount:");
    if (creditAmount && !isNaN(creditAmount)) {
        alert(`Credited amount of ₹${creditAmount} added.`);
    }
});

debitsTitle.addEventListener('click', () => {
    toggleVisibility(expenseSection);
});

document.addEventListener("DOMContentLoaded", renderExpenses);



expenseForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const newExpense = {
        name: document.getElementById('expense-name').value.trim() || 'Unnamed',
        amount: parseFloat(expenseAmountInput.value),
        date: expenseDateInput.value,
        category: expenseCategory.value,
        note: expenseNote.value.trim()
    };

    if (!newExpense.amount || isNaN(newExpense.amount)) {
        alert("Please enter a valid amount.");
        return;
    }

    expenses.push(newExpense);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    renderExpenses();

    // Reset form fields
    document.getElementById('expense-name').value = '';
    expenseAmountInput.value = '';
    expenseDateInput.value = '';
    expenseCategory.value = '';
    expenseNote.value = '';

    showMessage('Expense added successfully!');
});
debitsTitle.addEventListener('click', () => {
    const debitAmount = prompt("Enter the debited amount:");
    if (debitAmount && !isNaN(debitAmount) && parseFloat(debitAmount) > 0) {
        const newExpense = {
            name: 'Debit',
            amount: parseFloat(debitAmount),
            date: new Date().toISOString().split('T')[0],
            category: 'Debit',
            note: 'Debited from balance'
        };

        expenses.push(newExpense);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        renderExpenses();
        alert(`Debited ₹${debitAmount} successfully.`);
    } else {
        alert("Invalid debit amount.");
    }
});
