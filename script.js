const STORAGE_KEY = 'pocket-ledger-expenses-v1';
const categories = {
  Food: { icon: '◒', className: 'food' },
  Transport: { icon: '↗', className: 'transport' },
  Study: { icon: '▤', className: 'study' },
  Personal: { icon: '⌂', className: 'personal' },
  Entertainment: { icon: '♫', className: 'entertainment' },
  Other: { icon: '＋', className: 'other' },
};

const form = document.querySelector('#expense-form');
const list = document.querySelector('#transaction-list');
const searchInput = document.querySelector('#search-input');
const categoryFilter = document.querySelector('#category-filter');
const formMessage = document.querySelector('#form-message');

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((expense) => (
      expense && typeof expense.id === 'string' && typeof expense.name === 'string'
      && Number.isFinite(Number(expense.amount)) && categories[expense.category]
      && /^\d{4}-\d{2}-\d{2}$/.test(expense.date)
    )) : [];
  } catch {
    return [];
  }
}

let expenses = loadExpenses();

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch {
    return false;
  }
}

function currency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

function updateSummary() {
  const today = localDateString();
  const monthPrefix = today.slice(0, 7);
  const thisMonth = expenses.filter((expense) => expense.date.startsWith(monthPrefix));
  const todayTotal = expenses
    .filter((expense) => expense.date === today)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  const monthTotal = thisMonth.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const dayOfMonth = new Date().getDate();

  document.querySelector('#month-total').textContent = currency(monthTotal);
  document.querySelector('#today-total').textContent = currency(todayTotal);
  document.querySelector('#average-total').textContent = currency(monthTotal / dayOfMonth);
  document.querySelector('#month-caption').textContent = thisMonth.length
    ? `${thisMonth.length} ${thisMonth.length === 1 ? 'expense' : 'expenses'} recorded this month`
    : 'No expenses recorded yet';
  document.querySelector('#transaction-count').textContent = `${expenses.length} ${expenses.length === 1 ? 'entry' : 'entries'}`;
}

function createTransactionRow(expense, index) {
  const category = categories[expense.category];
  const row = document.createElement('article');
  row.className = 'transaction-row';
  row.style.animationDelay = `${Math.min(index, 8) * 25}ms`;

  const main = document.createElement('div');
  main.className = 'transaction-main';
  const icon = document.createElement('span');
  icon.className = `category-icon category-${category.className}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = category.icon;
  const copy = document.createElement('div');
  copy.className = 'transaction-copy';
  const name = document.createElement('p');
  name.className = 'transaction-name';
  name.textContent = expense.name;
  const detail = document.createElement('p');
  detail.className = 'transaction-detail';
  detail.textContent = `${expense.category} · ${formatDate(expense.date)}${expense.note ? ` · ${expense.note}` : ''}`;
  copy.append(name, detail);
  main.append(icon, copy);

  const amount = document.createElement('span');
  amount.className = 'transaction-amount';
  amount.textContent = `−${currency(Number(expense.amount))}`;

  const remove = document.createElement('button');
  remove.className = 'delete-button';
  remove.type = 'button';
  remove.setAttribute('aria-label', `Delete ${expense.name}`);
  remove.title = 'Delete expense';
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    expenses = expenses.filter((item) => item.id !== expense.id);
    saveExpenses();
    render();
  });

  row.append(main, amount, remove);
  return row;
}

function render() {
  updateSummary();
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedCategory = categoryFilter.value;
  const visibleExpenses = expenses
    .filter((expense) => selectedCategory === 'all' || expense.category === selectedCategory)
    .filter((expense) => `${expense.name} ${expense.note || ''} ${expense.category}`.toLocaleLowerCase().includes(query))
    .sort((first, second) => second.date.localeCompare(first.date) || second.id.localeCompare(first.id));

  list.replaceChildren();
  if (!visibleExpenses.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const mark = document.createElement('span');
    mark.className = 'empty-state-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = query || selectedCategory !== 'all' ? '⌕' : '＋';
    const title = document.createElement('strong');
    title.textContent = query || selectedCategory !== 'all' ? 'No matching expenses' : 'Your ledger is ready';
    const description = document.createElement('p');
    description.textContent = query || selectedCategory !== 'all'
      ? 'Try another search or category.'
      : 'Add your first expense and it will show up here.';
    empty.append(mark, title, description);
    list.append(empty);
    return;
  }

  visibleExpenses.forEach((expense, index) => list.append(createTransactionRow(expense, index)));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const amount = Number(data.get('amount'));
  if (!Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent = 'Enter an amount greater than zero.';
    return;
  }

  expenses.push({
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(data.get('name')).trim(),
    amount: Math.round(amount * 100) / 100,
    date: String(data.get('date')),
    category: String(data.get('category')),
    note: String(data.get('note')).trim(),
  });
  const saved = saveExpenses();
  form.reset();
  document.querySelector('#expense-date').value = localDateString();
  formMessage.textContent = saved ? 'Expense added.' : 'Added for this session, but browser storage is unavailable.';
  render();
});

searchInput.addEventListener('input', render);
categoryFilter.addEventListener('change', render);

document.querySelector('#export-button').addEventListener('click', () => {
  if (!expenses.length) {
    formMessage.textContent = 'Add an expense before exporting.';
    return;
  }
  const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [
    ['Date', 'Name', 'Category', 'Amount (INR)', 'Note'],
    ...expenses
      .slice()
      .sort((first, second) => second.date.localeCompare(first.date))
      .map((expense) => [expense.date, expense.name, expense.category, Number(expense.amount).toFixed(2), expense.note || '']),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `pocket-ledger-${localDateString()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector('#expense-date').value = localDateString();
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric',
}).format(new Date()).toUpperCase();
render();