import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import './App.css'

// --- Chart.js Setup ---
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Constants ---
const API_URL = 'http://localhost:5000/api/expenses'
const CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Other"]

function App() {
  // --- State ---
  // Raw data state
  const [expenses, setExpenses] = useState([])
  
  // Form state for adding a new expense
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]) // Default to today

  // State for filtering
  const [filterCategory, setFilterCategory] = useState('All')

  // State for editing
  const [editingId, setEditingId] = useState(null) // ID of expense being edited
  const [editForm, setEditForm] = useState({ id: null, description: '', amount: '', category: '', date: '' })

  // --- Effects ---
  // Fetch all expenses on initial load
  useEffect(() => {
    fetchExpenses()
  }, [])

  // --- Derived State (using useMemo for performance) ---

  // 1. Filtered Expenses: The list of expenses to actually display
  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'All') {
      return expenses
    }
    return expenses.filter(exp => exp.category === filterCategory)
  }, [expenses, filterCategory])

  // 2. Total Expenses: The sum of *filtered* expenses
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((total, exp) => total + exp.amount, 0)
  }, [filteredExpenses])

  // 3. Chart Data
  // Note: This creates a chart by *category*, which is more useful
  // for an expense tracker than a "daily" chart.
  const pieChartData = useMemo(() => {
    const categoryTotals = {}
    CATEGORIES.forEach(cat => categoryTotals[cat] = 0) // Initialize all categories to 0

    filteredExpenses.forEach(exp => {
      if (categoryTotals.hasOwnProperty(exp.category)) {
        categoryTotals[exp.category] += exp.amount
      }
    })

    return {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: 'Expenses by Category',
          data: Object.values(categoryTotals),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }, [filteredExpenses])

  // --- API Functions ---
  const fetchExpenses = () => {
    axios.get(API_URL)
      .then(response => setExpenses(response.data))
      .catch(error => console.error("Error fetching expenses:", error))
  }

  const handleAddExpense = (e) => {
    e.preventDefault()
    const newExpense = { description, amount: parseFloat(amount), category, date }
    
    axios.post(API_URL, newExpense)
      .then(response => {
        // Add the new expense (with ID from backend) to state
        setExpenses([...expenses, response.data])
        // Reset form
        setDescription('')
        setAmount('')
        setCategory(CATEGORIES[0])
        setDate(new Date().toISOString().split('T')[0])
      })
      .catch(error => console.error("Error adding expense:", error))
  }

  const handleDeleteExpense = (id) => {
    axios.delete(`${API_URL}/${id}`)
      .then(() => {
        setExpenses(expenses.filter(expense => expense.id !== id))
      })
      .catch(error => console.error("Error deleting expense:", error))
  }
  
  const handleUpdateExpense = (e) => {
    e.preventDefault()
    const updatedExpense = {
      ...editForm,
      amount: parseFloat(editForm.amount)
    }
    
    axios.put(`${API_URL}/${editingId}`, updatedExpense)
      .then(response => {
        // Update the expense in the main list
        setExpenses(expenses.map(exp => 
          exp.id === editingId ? response.data : exp
        ))
        // Exit edit mode
        setEditingId(null)
      })
      .catch(error => console.error("Error updating expense:", error))
  }

  // --- Edit Mode Handlers ---
  
  // When user clicks "Edit"
  const startEditing = (expense) => {
    setEditingId(expense.id)
    setEditForm(expense)
  }

  // When user clicks "Cancel" in edit mode
  const cancelEditing = () => {
    setEditingId(null)
  }

  // Handle changes in the *edit* form inputs
  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm({ ...editForm, [name]: value })
  }

  // --- JSX ---
  return (
    <div className="App">
      <h1>Expense Tracker</h1>

      <div className="container-horizontal">
        {/* Left Column: Form and Chart */}
        <div className="container-vertical">
          {/* --- Add Expense Form --- */}
          <form onSubmit={handleAddExpense} className="expense-form card">
            <h2>Add New Expense</h2>
            <div>
              <label>Description:</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <label>Amount:</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div>
              <label>Category:</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label>Date:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <button type="submit">Add Expense</button>
          </form>

          {/* --- Pie Chart --- */}
          <div className="chart-container card">
            <h2>Expenses by Category</h2>
            {filteredExpenses.length > 0 ? (
              <Pie data={pieChartData} />
            ) : (
              <p>No data to display</p>
            )}
          </div>
        </div>

        {/* Right Column: Filter, Total, and List */}
        <div className="container-vertical">
          <div className="card">
            {/* --- Filter and Total --- */}
            <div className="filter-total-container">
              <div className="filter-controls">
                <label>Filter by Category: </label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="All">All</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="total-expenses">
                <h2>Total: ${totalExpenses.toFixed(2)}</h2>
              </div>
            </div>

            {/* --- Expense List --- */}
            <h2>Expenses</h2>
            <ul className="expense-list">
              {filteredExpenses.map(expense => (
                <li key={expense.id}>
                  {editingId === expense.id ? (
                    /* --- Edit Form --- */
                    <form onSubmit={handleUpdateExpense} className="edit-form">
                      <input type="text" name="description" value={editForm.description} onChange={handleEditFormChange} />
                      <input type="number" step="0.01" name="amount" value={editForm.amount} onChange={handleEditFormChange} />
                      <input type="date" name="date" value={editForm.date} onChange={handleEditFormChange} />
                      <select name="category" value={editForm.category} onChange={handleEditFormChange}>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <button type="submit">Save</button>
                      <button type="button" onClick={cancelEditing}>Cancel</button>
                    </form>
                  ) : (
                    /* --- Display Item --- */
                    <>
                      <div className="expense-item-details">
                        <span className="expense-date">{expense.date}</span>
                        <span className="expense-desc">{expense.description}</span>
                        <span className="expense-cat">{expense.category}</span>
                        <span className="expense-amt">${expense.amount.toFixed(2)}</span>
                      </div>
                      <div className="expense-item-buttons">
                        <button onClick={() => startEditing(expense)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="delete-btn">Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App