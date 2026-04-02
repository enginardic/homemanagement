import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Calendar, Home, CheckCircle, Circle, TrendingUp, TrendingDown, Wallet, Users, BarChart3, Copy, Cloud, CreditCard, Building2, Utensils, ChevronRight, Edit2, X, Download, Upload, Database } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EvYonetimApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [database, setDatabase] = useState({
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    expenses: [],
    incomes: [],
    tasks: [],
    members: [],
    banks: [],
    bankAccounts: [],
    creditCards: [],
    mealCards: [],
    expenseCategories: {
      market: { name: 'Market', color: '#10b981' },
      fatura: { name: 'Fatura', color: '#3b82f6' },
      ulasim: { name: 'Ulaşım', color: '#f59e0b' },
      saglik: { name: 'Sağlık', color: '#ef4444' },
      egitim: { name: 'Eğitim', color: '#8b5cf6' },
      eglence: { name: 'Eğlence', color: '#ec4899' },
      diger: { name: 'Diğer', color: '#6b7280' }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [newCategory, setNewCategory] = useState({ key: '', name: '', color: '#6b7280' });
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'market', date: '', memberId: '', recurring: false, planned: false, realized: false, paymentMethod: 'cash', paymentDetails: '' });
  const [newIncome, setNewIncome] = useState({ title: '', amount: '', source: 'maas', date: '', memberId: '', recurring: false, planned: false, realized: false });
  const [newTask, setNewTask] = useState({ title: '', assignee: '', dueDate: '', recurring: false, recurringType: 'daily' });
  const [newMember, setNewMember] = useState({ name: '', role: 'Aile Üyesi', color: '#3b82f6', email: '', password: '' });
  const [newBank, setNewBank] = useState({ name: '' });
  const [newBankAccount, setNewBankAccount] = useState({ bankId: '', iban: '', accountName: '', branch: '' });
  const [newCreditCard, setNewCreditCard] = useState({ bankId: '', type: 'credit', cardName: '' });
  const [newMealCard, setNewMealCard] = useState({ name: '' });

  const incomeSources = {
    maas: { name: 'Maaş', color: '#10b981' },
    serbest: { name: 'Serbest Çalışma', color: '#06b6d4' },
    kira: { name: 'Kira Geliri', color: '#6366f1' },
    yatirim: { name: 'Yatırım', color: '#8b5cf6' },
    diger: { name: 'Diğer', color: '#6b7280' }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const toInputDate = (ddmmyyyy) => {
    if (!ddmmyyyy || !ddmmyyyy.includes('.')) return ddmmyyyy;
    const [day, month, year] = ddmmyyyy.split('.');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSaveStatus = (message) => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const loadData = async () => {
    try {
      const dbRes = await window.storage.get('household_database').catch(() => null);
      
      if (dbRes?.value) {
        const loadedDb = JSON.parse(dbRes.value);
        setDatabase(loadedDb);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
      const today = new Date().toISOString().split('T')[0];
      setNewExpense(prev => ({ ...prev, date: today }));
      setNewIncome(prev => ({ ...prev, date: today }));
      setNewTask(prev => ({ ...prev, dueDate: today }));
    }
  };

  const saveDatabase = async (updatedDb) => {
    try {
      const dbToSave = {
        ...updatedDb,
        lastUpdated: new Date().toISOString()
      };
      await window.storage.set('household_database', JSON.stringify(dbToSave));
      setDatabase(dbToSave);
      showSaveStatus('✓ Kaydedildi');
    } catch (error) {
      console.error('Veri kaydetme hatası:', error);
      showSaveStatus('✗ Hata!');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(database, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ev-yonetim-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSaveStatus('✓ Dışa aktarıldı');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.version || !importedData.expenses) {
          showSaveStatus('✗ Geçersiz dosya formatı');
          return;
        }

        await saveDatabase(importedData);
        showSaveStatus('✓ Veriler içe aktarıldı');
      } catch (error) {
        console.error('İçe aktarma hatası:', error);
        showSaveStatus('✗ Dosya okunamadı');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Category operations
  const addCategory = () => {
    if (!newCategory.key || !newCategory.name) return;
    const updatedDb = {
      ...database,
      expenseCategories: {
        ...database.expenseCategories,
        [newCategory.key]: { name: newCategory.name, color: newCategory.color }
      }
    };
    saveDatabase(updatedDb);
    setNewCategory({ key: '', name: '', color: '#6b7280' });
  };

  const updateCategory = () => {
    if (!editingCategory) return;
    const updatedDb = {
      ...database,
      expenseCategories: {
        ...database.expenseCategories,
        [editingCategory.key]: { name: editingCategory.name, color: editingCategory.color }
      }
    };
    saveDatabase(updatedDb);
    setEditingCategory(null);
  };

  const deleteCategory = (key) => {
    const updated = { ...database.expenseCategories };
    delete updated[key];
    saveDatabase({ ...database, expenseCategories: updated });
  };

  // Bank operations
  const addBank = () => {
    if (!newBank.name) return;
    const updatedDb = {
      ...database,
      banks: [...database.banks, { ...newBank, id: Date.now() }]
    };
    saveDatabase(updatedDb);
    setNewBank({ name: '' });
  };

  const deleteBank = (id) => {
    saveDatabase({ ...database, banks: database.banks.filter(b => b.id !== id) });
  };

  const addBankAccount = () => {
    if (!newBankAccount.bankId || !newBankAccount.accountName) return;
    const updatedDb = {
      ...database,
      bankAccounts: [...database.bankAccounts, { ...newBankAccount, id: Date.now() }]
    };
    saveDatabase(updatedDb);
    setNewBankAccount({ bankId: '', iban: '', accountName: '', branch: '' });
  };

  const deleteBankAccount = (id) => {
    saveDatabase({ ...database, bankAccounts: database.bankAccounts.filter(a => a.id !== id) });
  };

  const addCreditCard = () => {
    if (!newCreditCard.bankId || !newCreditCard.cardName) return;
    const updatedDb = {
      ...database,
      creditCards: [...database.creditCards, { ...newCreditCard, id: Date.now() }]
    };
    saveDatabase(updatedDb);
    setNewCreditCard({ bankId: '', type: 'credit', cardName: '' });
  };

  const deleteCreditCard = (id) => {
    saveDatabase({ ...database, creditCards: database.creditCards.filter(c => c.id !== id) });
  };

  const addMealCard = () => {
    if (!newMealCard.name) return;
    const updatedDb = {
      ...database,
      mealCards: [...database.mealCards, { ...newMealCard, id: Date.now() }]
    };
    saveDatabase(updatedDb);
    setNewMealCard({ name: '' });
  };

  const deleteMealCard = (id) => {
    saveDatabase({ ...database, mealCards: database.mealCards.filter(m => m.id !== id) });
  };

  const addMember = () => {
    if (!newMember.name || !newMember.email) {
      showSaveStatus('⚠ İsim ve e-posta gerekli');
      return;
    }
    const updatedDb = {
      ...database,
      members: [...database.members, { ...newMember, id: Date.now() }]
    };
    saveDatabase(updatedDb);
    setNewMember({ name: '', role: 'Aile Üyesi', color: '#3b82f6', email: '', password: '' });
  };

  const deleteMember = (id) => {
    saveDatabase({ ...database, members: database.members.filter(m => m.id !== id) });
  };

  const addExpense = (memberId = null) => {
    if (!newExpense.title || !newExpense.amount) {
      showSaveStatus('⚠ Başlık ve tutar gerekli');
      return;
    }
    const expenseData = { 
      ...newExpense, 
      id: Date.now(), 
      amount: parseFloat(newExpense.amount),
      memberId: memberId || newExpense.memberId
    };
    const updatedDb = {
      ...database,
      expenses: [...database.expenses, expenseData]
    };
    saveDatabase(updatedDb);
    setNewExpense({ title: '', amount: '', category: Object.keys(database.expenseCategories)[0] || 'market', date: new Date().toISOString().split('T')[0], memberId: '', recurring: false, planned: false, realized: false, paymentMethod: 'cash', paymentDetails: '' });
    setSelectedMember(null);
  };

  const updateExpense = () => {
    if (!editingExpense) return;
    const updatedDb = {
      ...database,
      expenses: database.expenses.map(e => e.id === editingExpense.id ? { ...editingExpense, amount: parseFloat(editingExpense.amount) } : e)
    };
    saveDatabase(updatedDb);
    setEditingExpense(null);
  };

  const toggleExpenseRealized = (id) => {
    const updatedDb = {
      ...database,
      expenses: database.expenses.map(e => e.id === id ? { ...e, realized: !e.realized } : e)
    };
    saveDatabase(updatedDb);
  };

  const copyExpense = (expense) => {
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date().toISOString().split('T')[0],
      memberId: expense.memberId || '',
      recurring: expense.recurring || false,
      planned: false,
      realized: false,
      paymentMethod: expense.paymentMethod || 'cash',
      paymentDetails: expense.paymentDetails || ''
    });
    setActiveTab('expenses');
    showSaveStatus('📋 Masraf kopyalandı');
  };

  const addIncome = (memberId = null) => {
    if (!newIncome.title || !newIncome.amount) {
      showSaveStatus('⚠ Başlık ve tutar gerekli');
      return;
    }
    const incomeData = {
      ...newIncome,
      id: Date.now(),
      amount: parseFloat(newIncome.amount),
      memberId: memberId || newIncome.memberId
    };
    const updatedDb = {
      ...database,
      incomes: [...database.incomes, incomeData]
    };
    saveDatabase(updatedDb);
    setNewIncome({ title: '', amount: '', source: 'maas', date: new Date().toISOString().split('T')[0], memberId: '', recurring: false, planned: false, realized: false });
    setSelectedMember(null);
  };

  const updateIncome = () => {
    if (!editingIncome) return;
    const updatedDb = {
      ...database,
      incomes: database.incomes.map(i => i.id === editingIncome.id ? { ...editingIncome, amount: parseFloat(editingIncome.amount) } : i)
    };
    saveDatabase(updatedDb);
    setEditingIncome(null);
  };

  const toggleIncomeRealized = (id) => {
    const updatedDb = {
      ...database,
      incomes: database.incomes.map(i => i.id === id ? { ...i, realized: !i.realized } : i)
    };
    saveDatabase(updatedDb);
  };

  const deleteExpense = (id) => {
    saveDatabase({ ...database, expenses: database.expenses.filter(e => e.id !== id) });
  };

  const deleteIncome = (id) => {
    saveDatabase({ ...database, incomes: database.incomes.filter(i => i.id !== id) });
  };

  const addTask = (assigneeName = null) => {
    if (!newTask.title) {
      showSaveStatus('⚠ Görev başlığı gerekli');
      return;
    }
    const taskData = {
      ...newTask,
      id: Date.now(),
      completed: false,
      assignee: assigneeName || newTask.assignee
    };
    const updatedDb = {
      ...database,
      tasks: [...database.tasks, taskData]
    };
    saveDatabase(updatedDb);
    setNewTask({ title: '', assignee: '', dueDate: new Date().toISOString().split('T')[0], recurring: false, recurringType: 'daily' });
    setSelectedMember(null);
  };

  const updateTask = () => {
    if (!editingTask) return;
    const updatedDb = {
      ...database,
      tasks: database.tasks.map(t => t.id === editingTask.id ? editingTask : t)
    };
    saveDatabase(updatedDb);
    setEditingTask(null);
  };

  const toggleTask = (id) => {
    const updatedDb = {
      ...database,
      tasks: database.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    };
    saveDatabase(updatedDb);
  };

  const deleteTask = (id) => {
    saveDatabase({ ...database, tasks: database.tasks.filter(t => t.id !== id) });
  };

  const getMemberById = (id) => database.members.find(m => m.id === id);
  const getBankById = (id) => database.banks.find(b => b.id === id);

  const getMemberBalance = (memberId) => {
    const memberIncomes = database.incomes.filter(i => i.memberId === memberId && (!i.planned || i.realized));
    const memberExpenses = database.expenses.filter(e => e.memberId === memberId && (!e.planned || e.realized));
    const totalIncome = memberIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
    return totalIncome - totalExpense;
  };

  const getFilteredData = (data) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (filter === 'week') {
      return data.filter(item => new Date(item.date) >= weekAgo);
    } else if (filter === 'month') {
      return data.filter(item => new Date(item.date) >= monthAgo);
    }
    return data;
  };

  const getRealizedExpenses = () => database.expenses.filter(e => !e.planned || e.realized);
  const getRealizedIncomes = () => database.incomes.filter(i => !i.planned || i.realized);
  const getPlannedExpenses = () => database.expenses.filter(e => e.planned && !e.realized);
  const getPlannedIncomes = () => database.incomes.filter(i => i.planned && !i.realized);

  const filteredExpenses = getFilteredData(getRealizedExpenses());
  const filteredIncomes = getFilteredData(getRealizedIncomes());

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncomes = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const balance = totalIncomes - totalExpenses;
  
  const plannedExpensesTotal = getPlannedExpenses().reduce((sum, exp) => sum + exp.amount, 0);
  const plannedIncomesTotal = getPlannedIncomes().reduce((sum, inc) => sum + inc.amount, 0);
  const plannedBalance = plannedIncomesTotal - plannedExpensesTotal;

  const completedTasks = database.tasks.filter(t => t.completed).length;

  const getCategoryData = () => {
    const categoryTotals = {};
    filteredExpenses.forEach(exp => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += exp.amount;
    });
    return Object.entries(categoryTotals).map(([key, value]) => ({
      name: database.expenseCategories[key]?.name || key,
      value: value,
      color: database.expenseCategories[key]?.color || '#6b7280'
    }));
  };

  const getMemberData = () => {
    return database.members.map(member => {
      const memberExpenses = filteredExpenses.filter(e => e.memberId === member.id);
      const memberIncomes = filteredIncomes.filter(i => i.memberId === member.id);
      return {
        name: member.name,
        gelir: memberIncomes.reduce((s, i) => s + i.amount, 0),
        masraf: memberExpenses.reduce((s, e) => s + e.amount, 0),
        color: member.color
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (selectedMember) {
    const memberBalance = getMemberBalance(selectedMember.id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button onClick={() => setSelectedMember(null)} className="mb-4 text-indigo-600 flex items-center gap-2 hover:underline">
              ← Geri Dön
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl" style={{ backgroundColor: selectedMember.color }}>
                {selectedMember.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedMember.name}</h2>
                <p className="text-gray-600">{selectedMember.role}</p>
                <p className={`text-lg font-bold mt-1 ${memberBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Bakiye: {formatCurrency(memberBalance)} ₺
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Gelir Ekle
                </h3>
                <input type="text" placeholder="Başlık" value={newIncome.title} onChange={(e) => setNewIncome({ ...newIncome, title: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <input type="number" placeholder="Tutar" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <select value={newIncome.source} onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm">
                  {Object.entries(incomeSources).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
                <input type="date" value={newIncome.date} onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <button onClick={() => addIncome(selectedMember.id)} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm font-semibold">Ekle</button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Masraf Ekle
                </h3>
                <input type="text" placeholder="Başlık" value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <input type="number" placeholder="Tutar" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm">
                  {Object.entries(database.expenseCategories).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
                <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <button onClick={() => addExpense(selectedMember.id)} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm font-semibold">Ekle</button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Görev Ata
                </h3>
                <input type="text" placeholder="Görev" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <input type="checkbox" checked={newTask.recurring} onChange={(e) => setNewTask({ ...newTask, recurring: e.target.checked })} />
                  Tekrarlayan
                </label>
                {newTask.recurring && (
                  <select value={newTask.recurringType} onChange={(e) => setNewTask({ ...newTask, recurringType: e.target.value })} className="w-full px-3 py-2 border rounded mb-2 text-sm">
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                  </select>
                )}
                <button onClick={() => addTask(selectedMember.name)} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm font-semibold">Ata</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Home className="w-8 h-8" />
                  Ev Yönetim Merkezi Pro
                </h1>
                <p className="text-indigo-100 mt-2">Veritabanı v{database.version} - Son güncelleme: {formatDate(database.lastUpdated?.split('T')[0])}</p>
              </div>
              <div className="flex gap-2">
                {saveStatus && (
                  <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur text-sm font-medium">
                    {saveStatus}
                  </div>
                )}
                <button onClick={exportData} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors" title="Dışa Aktar">
                  <Download className="w-5 h-5" />
                </button>
                <label className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors cursor-pointer" title="İçe Aktar">
                  <Upload className="w-5 h-5" />
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" />
              <span>{database.expenses.length} masraf, {database.incomes.length} gelir, {database.tasks.length} görev</span>
            </div>
          </div>

          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', icon: Wallet, label: 'Genel Bakış' },
              { id: 'budget', icon: BarChart3, label: 'Bütçe' },
              { id: 'members', icon: Users, label: 'Üyeler' },
              { id: 'incomes', icon: TrendingUp, label: 'Gelirler' },
              { id: 'expenses', icon: TrendingDown, label: 'Masraflar' },
              { id: 'tasks', icon: Calendar, label: 'Görevler' },
              { id: 'categories', icon: BarChart3, label: 'Kategoriler' },
              { id: 'banks', icon: Building2, label: 'Bankalar' },
              { id: 'cards', icon: CreditCard, label: 'Kartlar' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-semibold transition-all whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-6 text-white">
                    <h3 className="text-sm font-semibold mb-2 opacity-90">Gerçekleşen Gelir</h3>
                    <p className="text-3xl font-bold">{formatCurrency(totalIncomes)} ₺</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-xl p-6 text-white">
                    <h3 className="text-sm font-semibold mb-2 opacity-90">Gerçekleşen Masraf</h3>
                    <p className="text-3xl font-bold">{formatCurrency(totalExpenses)} ₺</p>
                  </div>
                  <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-400 to-indigo-500' : 'from-orange-400 to-red-500'} rounded-xl p-6 text-white`}>
                    <h3 className="text-sm font-semibold mb-2 opacity-90">Net Bakiye</h3>
                    <p className="text-3xl font-bold">{formatCurrency(balance)} ₺</p>
                  </div>
                  <div className={`bg-gradient-to-br ${plannedBalance >= 0 ? 'from-cyan-400 to-blue-500' : 'from-yellow-400 to-orange-500'} rounded-xl p-6 text-white`}>
                    <h3 className="text-sm font-semibold mb-2 opacity-90">Planlanan Bakiye</h3>
                    <p className="text-3xl font-bold">{formatCurrency(plannedBalance)} ₺</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-900 mb-4">Görev Durumu</h3>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-white rounded-lg p-4">
                        <p className="text-2xl font-bold text-purple-600">{completedTasks}/{database.tasks.length}</p>
                        <p className="text-sm text-gray-600">Tamamlanan</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-4">
                        <p className="text-2xl font-bold text-orange-600">{database.tasks.length - completedTasks}</p>
                        <p className="text-sm text-gray-600">Bekleyen</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-xl p-6">
                    <h3 className="font-semibold text-indigo-900 mb-4">Veritabanı İstatistikleri</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-lg font-bold text-indigo-600">{database.members.length}</p>
                        <p className="text-xs text-gray-600">Üye</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-lg font-bold text-green-600">{database.banks.length}</p>
                        <p className="text-xs text-gray-600">Banka</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-lg font-bold text-blue-600">{database.creditCards.length}</p>
                        <p className="text-xs text-gray-600">Kart</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-lg font-bold text-orange-600">{Object.keys(database.expenseCategories).length}</p>
                        <p className="text-xs text-gray-600">Kategori</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Bütçe Planlaması</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-green-700">Planlanan Gelirler</h3>
                    <div className="space-y-2">
                      {getPlannedIncomes().map(inc => (
                        <div key={inc.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{inc.title}</p>
                            <p className="text-sm text-gray-600">{formatDate(inc.date)}</p>
                          </div>
                          <p className="font-bold text-green-600">+{formatCurrency(inc.amount)} ₺</p>
                        </div>
                      ))}
                      {getPlannedIncomes().length === 0 && <p className="text-gray-500 text-center py-4">Planlanan gelir yok</p>}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-lg font-bold text-green-700">Toplam: {formatCurrency(plannedIncomesTotal)} ₺</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-red-700">Planlanan Masraflar</h3>
                    <div className="space-y-2">
                      {getPlannedExpenses().map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{exp.title}</p>
                            <p className="text-sm text-gray-600">{formatDate(exp.date)}</p>
                          </div>
                          <p className="font-bold text-red-600">-{formatCurrency(exp.amount)} ₺</p>
                        </div>
                      ))}
                      {getPlannedExpenses().length === 0 && <p className="text-gray-500 text-center py-4">Planlanan masraf yok</p>}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-lg font-bold text-red-700">Toplam: {formatCurrency(plannedExpensesTotal)} ₺</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-2">Bütçe Dengesi</h3>
                  <p className="text-4xl font-bold">{formatCurrency(plannedBalance)} ₺</p>
                  <p className="mt-2 opacity-90">{plannedBalance >= 0 ? 'Bütçe fazlası' : 'Bütçe açığı'}</p>
                </div>
              </div>
            )}

{activeTab === 'categories' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Masraf Kategorileri</h2>
                
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-2" />Yeni Kategori</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input type="text" placeholder="Anahtar (örn: gida)" value={newCategory.key} onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toLowerCase() })} className="px-4 py-2 border rounded-lg" />
                    <input type="text" placeholder="Kategori Adı" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="px-4 py-2 border rounded-lg" />
                    <input type="color" value={newCategory.color} onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })} className="w-full h-10 border rounded-lg" />
                    <button onClick={addCategory} className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(database.expenseCategories).map(([key, cat]) => (
                    <div key={key} className="bg-white border rounded-xl p-4">
                      {editingCategory?.key === key ? (
                        <div className="space-y-2">
                          <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
                          <input type="color" value={editingCategory.color} onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })} className="w-full h-10 border rounded" />
                          <div className="flex gap-2">
                            <button onClick={updateCategory} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm">Kaydet</button>
                            <button onClick={() => setEditingCategory(null)} className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 text-sm">İptal</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: cat.color }}></div>
                            <div>
                              <p className="font-semibold">{cat.name}</p>
                              <p className="text-xs text-gray-500">{key}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCategory({ key, ...cat })} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteCategory(key)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-2" />Yeni Üye</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input type="text" placeholder="İsim" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="px-4 py-2 border rounded-lg" />
                    <input type="email" placeholder="E-posta" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="px-4 py-2 border rounded-lg" />
                    <input type="password" placeholder="Şifre" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} className="px-4 py-2 border rounded-lg" />
                    <input type="text" placeholder="Rol" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="px-4 py-2 border rounded-lg" />
                    <div className="flex gap-2">
                      <input type="color" value={newMember.color} onChange={(e) => setNewMember({ ...newMember, color: e.target.value })} className="w-16 h-10 border rounded-lg" />
                      <button onClick={addMember} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {database.members.map(m => {
                    const mBalance = getMemberBalance(m.id);
                    const mExp = getRealizedExpenses().filter(e => e.memberId === m.id);
                    const mInc = getRealizedIncomes().filter(i => i.memberId === m.id);
                    const mTsk = database.tasks.filter(t => t.assignee === m.name);
                    return (
                      <div key={m.id} className="bg-white border rounded-xl p-5 hover:shadow-lg transition">
                        <div className="flex justify-between mb-4">
                          <div className="flex gap-3">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: m.color }}>
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{m.name}</h4>
                              <p className="text-sm text-gray-600">{m.role}</p>
                              <p className={`text-sm font-bold ${mBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(mBalance)} ₺
                              </p>
                            </div>
                          </div>
                          <button onClick={() => deleteMember(m.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          <div className="bg-green-50 rounded p-2"><p className="text-xs">Gelir</p><p className="font-bold text-green-600">{mInc.length}</p></div>
                          <div className="bg-red-50 rounded p-2"><p className="text-xs">Masraf</p><p className="font-bold text-red-600">{mExp.length}</p></div>
                          <div className="bg-purple-50 rounded p-2"><p className="text-xs">Görev</p><p className="font-bold text-purple-600">{mTsk.length}</p></div>
                        </div>
                        <button onClick={() => setSelectedMember(m)} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold text-sm flex items-center justify-center gap-2">
                          İşlem Yap <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'incomes' && (
              <div>
                {editingIncome ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Edit2 className="w-5 h-5" />
                        Gelir Düzenle
                      </h3>
                      <button onClick={() => setEditingIncome(null)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input type="text" value={editingIncome.title} onChange={(e) => setEditingIncome({ ...editingIncome, title: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <input type="number" value={editingIncome.amount} onChange={(e) => setEditingIncome({ ...editingIncome, amount: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={editingIncome.source} onChange={(e) => setEditingIncome({ ...editingIncome, source: e.target.value })} className="px-4 py-2 border rounded-lg">
                        {Object.entries(incomeSources).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                      </select>
                      <input type="date" value={editingIncome.date} onChange={(e) => setEditingIncome({ ...editingIncome, date: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <button onClick={updateIncome} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-2" />Yeni Gelir</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input type="text" placeholder="Başlık" value={newIncome.title} onChange={(e) => setNewIncome({ ...newIncome, title: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <input type="number" placeholder="Tutar" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={newIncome.source} onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })} className="px-4 py-2 border rounded-lg">
                        {Object.entries(incomeSources).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                      </select>
                      <input type="date" value={newIncome.date} onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={newIncome.memberId} onChange={(e) => setNewIncome({ ...newIncome, memberId: e.target.value })} className="px-4 py-2 border rounded-lg">
                        <option value="">Üye</option>
                        {database.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"><input type="checkbox" checked={newIncome.planned} onChange={(e) => setNewIncome({ ...newIncome, planned: e.target.checked, realized: false })} /><span className="text-sm">Planlanan</span></label>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"><input type="checkbox" checked={newIncome.recurring} onChange={(e) => setNewIncome({ ...newIncome, recurring: e.target.checked })} /><span className="text-sm">Tekrarlayan</span></label>
                      <button onClick={() => addIncome()} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">Ekle</button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {database.incomes.map(inc => {
                    const m = getMemberById(inc.memberId);
                    const isUnrealized = inc.planned && !inc.realized;
                    return (
                      <div key={inc.id} className={`${isUnrealized ? 'bg-yellow-50 border-yellow-300' : 'bg-white'} border-l-4 border-green-500 rounded-xl p-4`}>
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{inc.title}</h4>
                              {m && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0).toUpperCase()}</div>}
                              {inc.recurring && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Tekrarlayan</span>}
                              {inc.planned && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Planlanan</span>}
                              {inc.planned && (
                                <label className="flex items-center gap-1 text-sm">
                                  <input type="checkbox" checked={inc.realized} onChange={() => toggleIncomeRealized(inc.id)} className="w-4 h-4" />
                                  <span className="text-xs">Gerçekleşti</span>
                                </label>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: incomeSources[inc.source]?.color + '20', color: incomeSources[inc.source]?.color }}>{incomeSources[inc.source]?.name || inc.source}</span>
                              <span className="px-3 py-1 rounded-full text-sm bg-gray-100">{formatDate(inc.date)}</span>
                              {m && <span className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700">{m.name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-green-600">+{formatCurrency(inc.amount)} ₺</span>
                            <button onClick={() => setEditingIncome(inc)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => deleteIncome(inc.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                {editingExpense ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Edit2 className="w-5 h-5" />
                        Masraf Düzenle
                      </h3>
                      <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input type="text" value={editingExpense.title} onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <input type="number" value={editingExpense.amount} onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={editingExpense.category} onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })} className="px-4 py-2 border rounded-lg">
                        {Object.entries(database.expenseCategories).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                      </select>
                      <input type="date" value={editingExpense.date} onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <button onClick={updateExpense} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-2" />Yeni Masraf</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input type="text" placeholder="Başlık" value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <input type="number" placeholder="Tutar" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="px-4 py-2 border rounded-lg">
                        {Object.entries(database.expenseCategories).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                      </select>
                      <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={newExpense.memberId} onChange={(e) => setNewExpense({ ...newExpense, memberId: e.target.value })} className="px-4 py-2 border rounded-lg">
                        <option value="">Üye</option>
                        {database.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <select value={newExpense.paymentMethod} onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value, paymentDetails: '' })} className="px-4 py-2 border rounded-lg">
                        <option value="cash">Nakit</option>
                        <option value="bank">Banka Transferi</option>
                        <option value="credit">Kredi Kartı</option>
                        <option value="meal">Yemek Kartı</option>
                      </select>
                      
                      {newExpense.paymentMethod === 'bank' && (
                        <select value={newExpense.paymentDetails} onChange={(e) => setNewExpense({ ...newExpense, paymentDetails: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="">Banka Seçin</option>
                          {database.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      )}
                      
                      {newExpense.paymentMethod === 'credit' && (
                        <select value={newExpense.paymentDetails} onChange={(e) => setNewExpense({ ...newExpense, paymentDetails: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="">Kart Seçin</option>
                          {database.creditCards.map(c => <option key={c.id} value={c.id}>{c.cardName}</option>)}
                        </select>
                      )}
                      
                      {newExpense.paymentMethod === 'meal' && (
                        <select value={newExpense.paymentDetails} onChange={(e) => setNewExpense({ ...newExpense, paymentDetails: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="">Yemek Kartı Seçin</option>
                          {database.mealCards.map(mc => <option key={mc.id} value={mc.id}>{mc.name}</option>)}
                        </select>
                      )}

                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"><input type="checkbox" checked={newExpense.planned} onChange={(e) => setNewExpense({ ...newExpense, planned: e.target.checked, realized: false })} /><span className="text-sm">Planlanan</span></label>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"><input type="checkbox" checked={newExpense.recurring} onChange={(e) => setNewExpense({ ...newExpense, recurring: e.target.checked })} /><span className="text-sm">Tekrarlayan</span></label>
                      <button onClick={() => addExpense()} className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {database.expenses.map(exp => {
                    const m = getMemberById(exp.memberId);
                    const isUnrealized = exp.planned && !exp.realized;
                    let paymentText = 'Nakit';
                    if (exp.paymentMethod === 'bank') paymentText = 'Banka: ' + (getBankById(exp.paymentDetails)?.name || '-');
                    if (exp.paymentMethod === 'credit') paymentText = 'Kart: ' + (database.creditCards.find(c => c.id === exp.paymentDetails)?.cardName || '-');
                    if (exp.paymentMethod === 'meal') paymentText = 'Yemek: ' + (database.mealCards.find(mc => mc.id === exp.paymentDetails)?.name || '-');
                    
                    return (
                      <div key={exp.id} className={`${isUnrealized ? 'bg-yellow-50 border-yellow-300' : 'bg-white'} border-l-4 border-red-500 rounded-xl p-4`}>
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{exp.title}</h4>
                              {m && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0).toUpperCase()}</div>}
                              {exp.recurring && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Tekrarlayan</span>}
                              {exp.planned && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Planlanan</span>}
                              {exp.planned && (
                                <label className="flex items-center gap-1 text-sm">
                                  <input type="checkbox" checked={exp.realized} onChange={() => toggleExpenseRealized(exp.id)} className="w-4 h-4" />
                                  <span className="text-xs">Gerçekleşti</span>
                                </label>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: database.expenseCategories[exp.category]?.color + '20', color: database.expenseCategories[exp.category]?.color }}>{database.expenseCategories[exp.category]?.name || exp.category}</span>
                              <span className="px-3 py-1 rounded-full text-sm bg-gray-100">{formatDate(exp.date)}</span>
                              <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">{paymentText}</span>
                              {m && <span className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700">{m.name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-red-600">-{formatCurrency(exp.amount)} ₺</span>
                            <button onClick={() => setEditingExpense(exp)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => copyExpense(exp)} className="text-blue-500 hover:text-blue-700" title="Kopyala"><Copy className="w-5 h-5" /></button>
                            <button onClick={() => deleteExpense(exp.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                {editingTask ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Edit2 className="w-5 h-5" />
                        Görev Düzenle
                      </h3>
                      <button onClick={() => setEditingTask(null)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={editingTask.assignee} onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })} className="px-4 py-2 border rounded-lg">
                        <option value="">Sorumlu</option>
                        {database.members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                      <input type="date" value={editingTask.dueDate} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <button onClick={updateTask} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold mb-4"><PlusCircle className="inline w-5 h-5 mr-2" />Yeni Görev</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <input type="text" placeholder="Görev" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })} className="px-4 py-2 border rounded-lg">
                        <option value="">Sorumlu</option>
                        {database.members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                      <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="px-4 py-2 border rounded-lg" />
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"><input type="checkbox" checked={newTask.recurring} onChange={(e) => setNewTask({ ...newTask, recurring: e.target.checked })} /><span className="text-sm">Tekrarlayan</span></label>
                      {newTask.recurring && (
                        <select value={newTask.recurringType} onChange={(e) => setNewTask({ ...newTask, recurringType: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="daily">Günlük</option>
                          <option value="weekly">Haftalık</option>
                          <option value="monthly">Aylık</option>
                        </select>
                      )}
                      <button onClick={() => addTask()} className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-semibold">Ata</button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {database.tasks.map(task => {
                    const am = database.members.find(m => m.name === task.assignee);
                    return (
                      <div key={task.id} className={`bg-white border rounded-xl p-4 ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <button onClick={() => toggleTask(task.id)} className="text-purple-600">
                              {task.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${task.completed ? 'line-through' : ''}`}>{task.title}</h4>
                              <div className="flex gap-3 mt-1 text-sm items-center">
                                {task.assignee && am && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: am.color }}>{task.assignee.charAt(0).toUpperCase()}</div>
                                    <span>{task.assignee}</span>
                                  </div>
                                )}
                                <span>📅 {formatDate(task.dueDate)}</span>
                                {task.recurring && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{task.recurringType === 'daily' ? 'Günlük' : task.recurringType === 'weekly' ? 'Haftalık' : 'Aylık'}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingTask(task)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700 ml-3"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'banks' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-4"><Building2 className="inline w-5 h-5 mr-2" />Yeni Banka</h3>
                      <div className="flex gap-3">
                        <input type="text" placeholder="Banka Adı" value={newBank.name} onChange={(e) => setNewBank({ name: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg" />
                        <button onClick={addBank} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold">Ekle</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {database.banks.map(b => (
                        <div key={b.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-green-600" />
                            <span className="font-semibold">{b.name}</span>
                          </div>
                          <button onClick={() => deleteBank(b.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-4"><Wallet className="inline w-5 h-5 mr-2" />Yeni Banka Hesabı</h3>
                      <div className="grid gap-3">
                        <select value={newBankAccount.bankId} onChange={(e) => setNewBankAccount({ ...newBankAccount, bankId: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="">Banka Seçin</option>
                          {database.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <input type="text" placeholder="Hesap Adı" value={newBankAccount.accountName} onChange={(e) => setNewBankAccount({ ...newBankAccount, accountName: e.target.value })} className="px-4 py-2 border rounded-lg" />
                        <input type="text" placeholder="IBAN (opsiyonel)" value={newBankAccount.iban} onChange={(e) => setNewBankAccount({ ...newBankAccount, iban: e.target.value })} className="px-4 py-2 border rounded-lg" />
                        <input type="text" placeholder="Şube (opsiyonel)" value={newBankAccount.branch} onChange={(e) => setNewBankAccount({ ...newBankAccount, branch: e.target.value })} className="px-4 py-2 border rounded-lg" />
                        <button onClick={addBankAccount} className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold">Ekle</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {database.bankAccounts.map(acc => {
                        const bank = getBankById(acc.bankId);
                        return (
                          <div key={acc.id} className="bg-white border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">{acc.accountName}</p>
                                <p className="text-sm text-gray-600">{bank?.name}</p>
                              </div>
                              <button onClick={() => deleteBankAccount(acc.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            {acc.iban && <p className="text-xs text-gray-500">IBAN: {acc.iban}</p>}
                            {acc.branch && <p className="text-xs text-gray-500">Şube: {acc.branch}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cards' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-4"><CreditCard className="inline w-5 h-5 mr-2" />Yeni Kredi/Banka Kartı</h3>
                      <div className="grid gap-3">
                        <select value={newCreditCard.bankId} onChange={(e) => setNewCreditCard({ ...newCreditCard, bankId: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="">Banka Seçin</option>
                          {database.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <input type="text" placeholder="Kart Adı" value={newCreditCard.cardName} onChange={(e) => setNewCreditCard({ ...newCreditCard, cardName: e.target.value })} className="px-4 py-2 border rounded-lg" />
                        <select value={newCreditCard.type} onChange={(e) => setNewCreditCard({ ...newCreditCard, type: e.target.value })} className="px-4 py-2 border rounded-lg">
                          <option value="credit">Kredi Kartı</option>
                          <option value="debit">Debit Kart</option>
                        </select>
                        <button onClick={addCreditCard} className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Ekle</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {database.creditCards.map(card => {
                        const bank = getBankById(card.bankId);
                        return (
                          <div key={card.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{card.cardName}</p>
                              <p className="text-sm text-gray-600">{bank?.name} - {card.type === 'credit' ? 'Kredi Kartı' : 'Debit Kart'}</p>
                            </div>
                            <button onClick={() => deleteCreditCard(card.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <h3 className="font-semibold mb-4"><Utensils className="inline w-5 h-5 mr-2" />Yeni Yemek Kartı</h3>
                      <div className="flex gap-3">
                        <input type="text" placeholder="Kart Adı" value={newMealCard.name} onChange={(e) => setNewMealCard({ name: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg" />
                        <button onClick={addMealCard} className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-semibold">Ekle</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {database.mealCards.map(mc => (
                        <div key={mc.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Utensils className="w-6 h-6 text-orange-600" />
                            <span className="font-semibold">{mc.name}</span>
                          </div>
                          <button onClick={() => deleteMealCard(mc.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
