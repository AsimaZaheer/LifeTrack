import React, { useState, useEffect } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import "./App.css";

function App() {
  // Theme and layout state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [activeModule, setActiveModule] = useState("todo");

  // Apply theme class to body
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      {/* Header */}
      <header className="app-header">
        <h1>Productivity Suite</h1>
        <div className="header-controls">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="main-nav">
        <button 
          className={activeModule === "todo" ? "active" : ""}
          onClick={() => setActiveModule("todo")}
        >
          📝 To-Do List
        </button>
        <button 
          className={activeModule === "diary" ? "active" : ""}
          onClick={() => setActiveModule("diary")}
        >
          📓 Personal Diary
        </button>
        <button 
          className={activeModule === "expenses" ? "active" : ""}
          onClick={() => setActiveModule("expenses")}
        >
          💰 Expense Tracker
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {activeModule === "todo" && <TodoModule darkMode={darkMode} />}
        {activeModule === "diary" && <DiaryModule darkMode={darkMode} />}
        {activeModule === "expenses" && <ExpenseModule darkMode={darkMode} />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Productivity Suite</p>
      </footer>
    </div>
  );
}

// To-Do List Module
function TodoModule({ darkMode }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("tasks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse tasks", e);
      return [];
    }
  });
  
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Streak State
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("streak");
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [lastCompleteDate, setLastCompleteDate] = useState(() => {
    return localStorage.getItem("lastCompleteDate") || null;
  });

  // Badges state
  const [badges, setBadges] = useState(() => {
    try {
      const saved = localStorage.getItem("badges");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse badges", e);
      return [];
    }
  });

  // Save states in localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("streak", streak.toString());
    if (lastCompleteDate) {
      localStorage.setItem("lastCompleteDate", lastCompleteDate);
    }
  }, [streak, lastCompleteDate]);

  useEffect(() => {
    localStorage.setItem("badges", JSON.stringify(badges));
  }, [badges]);

  // Add Task with validation
  const addTask = () => {
    if (newTask.trim() === "") return;
    const newTaskObj = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      due: dueDate,
      priority,
      category: category.trim(),
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTaskObj]);
    setNewTask("");
    setDueDate("");
    setPriority("medium");
    setCategory("");
  };

  // Handle Task Complete + Streak Update
  const toggleTask = (id) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    const toggledTask = updatedTasks.find(task => task.id === id);
    if (!toggledTask.completed) return; // Only when marking as complete
    
    const today = new Date().toDateString();
    if (lastCompleteDate === today) return; // Already updated today
    
    const oneDay = 86400000; // milliseconds in a day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (
      !lastCompleteDate || 
      new Date(today) - new Date(lastCompleteDate) === oneDay ||
      new Date(lastCompleteDate).toDateString() === yesterday.toDateString()
    ) {
      setStreak(streak + 1);
    } else {
      setStreak(1);
    }
    setLastCompleteDate(today);
  };

  // Start editing a task
  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setDueDate(task.due || "");
    setPriority(task.priority || "medium");
    setCategory(task.category || "");
  };

  // Save edited task
  const saveEdit = () => {
    setTasks(tasks.map(task =>
      task.id === editingId 
        ? { 
            ...task, 
            text: editText, 
            due: dueDate,
            priority,
            category: category.trim()
          } 
        : task
    ));
    setEditingId(null);
  };

  // Delete Single Task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Clear All Tasks with confirmation
  const clearAll = () => {
    if (window.confirm("Are you sure you want to delete all tasks?")) {
      setTasks([]);
    }
  };

  // Filters and search
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    
    return true;
  });

  // Sort by priority and due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    if (a.due && b.due) {
      return new Date(a.due) - new Date(b.due);
    }
    
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Progress %
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Check Achievements
  useEffect(() => {
    const newBadges = [...badges];
    
    // Task-based achievements
    if (completedTasks >= 10 && !newBadges.includes("🎯 Getting Started")) {
      newBadges.push("🎯 Getting Started");
    }
    if (completedTasks >= 100 && !newBadges.includes("💯 Pro Planner")) {
      newBadges.push("💯 Pro Planner");
    }
    
    // Streak-based achievements
    if (streak >= 7 && !newBadges.includes("🕖 Consistency King")) {
      newBadges.push("🕖 Consistency King");
    }
    if (streak >= 30 && !newBadges.includes("📅 Monthly Master")) {
      newBadges.push("📅 Monthly Master");
    }
    
    // Category-based achievements
    const categoriesUsed = new Set(tasks.map(t => t.category).filter(Boolean));
    if (categoriesUsed.size >= 5 && !newBadges.includes("🏷️ Category Pro")) {
      newBadges.push("🏷️ Category Pro");
    }
    
    if (JSON.stringify(newBadges) !== JSON.stringify(badges)) {
      setBadges(newBadges);
    }
  }, [completedTasks, streak, tasks, badges]);

  // Handle Enter key press for adding/editing tasks
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (editingId) saveEdit();
      else addTask();
    }
  };

  // Get unique categories
  const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];

  return (
    <div className="module-container">
      <h2>📝 To-Do List</h2>
      
      {/* Input Section */}
      <div className="input-section">
        <input
          type="text"
          placeholder="Enter a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
          aria-label="New task input"
        />
        
        <div className="task-options">
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Task priority"
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            min={format(new Date(), 'yyyy-MM-dd')}
          />
          
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Task category"
            list="categories"
          />
          <datalist id="categories">
            {categories.map((cat, i) => (
              <option key={i} value={cat} />
            ))}
          </datalist>
          
          <button onClick={addTask} disabled={!newTask.trim()}>Add Task</button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
        
        <div className="filters">
          <button 
            onClick={() => setFilter("all")} 
            className={filter === "all" ? "active" : ""}
          >
            All
          </button>
          <button 
            onClick={() => setFilter("completed")} 
            className={filter === "completed" ? "active" : ""}
          >
            Completed
          </button>
          <button 
            onClick={() => setFilter("pending")} 
            className={filter === "pending" ? "active" : ""}
          >
            Pending
          </button>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="stats-section">
        <div className="streak-box">
          🔥 Streak: <strong>{streak} {streak === 1 ? "day" : "days"}</strong>
        </div>
        <div className="progress-section">
          <p>
            You've completed {completedTasks} of {totalTasks} tasks ✅ (
            {Math.round(progress)}%)
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
              aria-valuenow={Math.round(progress)}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
      
      {/* Task List */}
      <ul className="task-list">
        {sortedTasks.length > 0 ? (
          sortedTasks.map(task => (
            <li 
              key={task.id} 
              className={`${task.completed ? "completed" : ""} ${task.priority}`}
            >
              {editingId === task.id ? (
                <div className="edit-task">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                  />
                  <div className="edit-options">
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Category"
                    />
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="task-text">{task.text}</span>
                  {task.category && (
                    <span className="task-category">{task.category}</span>
                  )}
                  {task.due && (
                    <span className={`due-date ${
                      !task.completed && new Date(task.due) < new Date() ? 'overdue' : ''
                    }`}>
                      {format(new Date(task.due), 'MMM dd')}
                      {isToday(new Date(task.due)) && ' (Today)'}
                      {isYesterday(new Date(task.due)) && ' (Yesterday)'}
                    </span>
                  )}
                </label>
              )}
              
              {editingId !== task.id && (
                <div className="task-actions">
                  <button 
                    onClick={() => startEdit(task)}
                    className="edit-btn"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="delete-btn"
                  >
                    ❌
                  </button>
                </div>
              )}
            </li>
          ))
        ) : (
          <li className="empty-state">
            {searchQuery ? "No matching tasks found" : "No tasks yet. Add one above!"}
          </li>
        )}
      </ul>
      
      {/* Footer */}
      <div className="module-footer">
        <p>{tasks.filter(t => !t.completed).length} {tasks.filter(t => !t.completed).length === 1 ? "task" : "tasks"} pending</p>
        {tasks.length > 0 && (
          <button onClick={clearAll} className="clear-all">
            Clear All Tasks
          </button>
        )}
      </div>
      
      {/* Achievements */}
      <div className="badges-box">
        <h3>🏆 Achievements</h3>
        {badges.length > 0 ? (
          <ul className="badges-list">
            {badges.map((badge, i) => (
              <li key={i}>{badge}</li>
            ))}
          </ul>
        ) : (
          <p className="no-badges">No badges earned yet. Keep going! 🚀</p>
        )}
      </div>
    </div>
  );
}

// Diary Module
function DiaryModule({ darkMode }) {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem("diaryEntries");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse diary entries", e);
      return [];
    }
  });
  
  const [currentEntry, setCurrentEntry] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // Save entries to localStorage
  useEffect(() => {
    localStorage.setItem("diaryEntries", JSON.stringify(entries));
  }, [entries]);

  // Add new entry
  const addEntry = () => {
    if (currentEntry.trim() === "") return;
    
    const newEntry = {
      id: Date.now(),
      title: currentTitle.trim() || "Untitled Entry",
      content: currentEntry.trim(),
      date: new Date().toISOString(),
      tags: []
    };
    
    setEntries([newEntry, ...entries]);
    setCurrentEntry("");
    setCurrentTitle("");
  };

  // Start editing an entry
  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditText(entry.content);
    setEditTitle(entry.title);
  };

  // Save edited entry
  const saveEdit = () => {
    setEntries(entries.map(entry =>
      entry.id === editingId 
        ? { ...entry, content: editText, title: editTitle } 
        : entry
    ));
    setEditingId(null);
  };

  // Delete entry
  const deleteEntry = (id) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  // Filter entries by search
  const filteredEntries = entries.filter(entry => {
    if (searchDate && !entry.date.includes(searchDate)) return false;
    if (searchText && 
        !entry.content.toLowerCase().includes(searchText.toLowerCase()) &&
        !entry.title.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="module-container">
      <h2>📓 Personal Diary</h2>
      
      {/* New Entry Section */}
      <div className="diary-input">
        <input
          type="text"
          placeholder="Entry title (optional)"
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
        />
        <textarea
          placeholder="Write your thoughts here..."
          value={currentEntry}
          onChange={(e) => setCurrentEntry(e.target.value)}
          rows="6"
        />
        <button onClick={addEntry} disabled={!currentEntry.trim()}>
          Save Entry
        </button>
      </div>
      
      {/* Search Section */}
      <div className="diary-search">
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder="Search by date"
        />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search entries..."
        />
      </div>
      
      {/* Entries List */}
      <div className="entries-list">
        {filteredEntries.length > 0 ? (
          filteredEntries.map(entry => (
            <div key={entry.id} className="diary-entry">
              {editingId === entry.id ? (
                <div className="edit-entry">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="6"
                  />
                  <div className="edit-actions">
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="entry-header">
                    <h3>{entry.title}</h3>
                    <span className="entry-date">
                      {format(new Date(entry.date), 'MMMM do, yyyy - h:mm a')}
                    </span>
                  </div>
                  <p className="entry-content">{entry.content}</p>
                  <div className="entry-actions">
                    <button onClick={() => startEdit(entry)}>Edit</button>
                    <button onClick={() => deleteEntry(entry.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="empty-state">
            {entries.length === 0 
              ? "No entries yet. Write your first entry above!" 
              : "No entries match your search."}
          </p>
        )}
      </div>
    </div>
  );
}

// Expense Tracker Module
function ExpenseModule({ darkMode }) {
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("expenses");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse expenses", e);
      return [];
    }
  });
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  // Save expenses to localStorage
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // Add new expense
  const addExpense = () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    const newExpense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      date,
      createdAt: new Date().toISOString()
    };
    
    setExpenses([newExpense, ...expenses]);
    setAmount("");
    setDescription("");
    setCategory("food");
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Start editing an expense
  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditDescription(expense.description);
    setEditDate(expense.date);
  };

  // Save edited expense
  const saveEdit = () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) return;
    
    setExpenses(expenses.map(expense =>
      expense.id === editingId 
        ? { 
            ...expense, 
            amount: parseFloat(editAmount),
            category: editCategory,
            description: editDescription.trim(),
            date: editDate
          } 
        : expense
    ));
    setEditingId(null);
  };

  // Delete expense
  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  // Filter expenses by month
  const filteredExpenses = expenses.filter(expense => 
    expense.date.includes(filterMonth)
  );

  // Calculate monthly summary
  const monthlySummary = filteredExpenses.reduce(
    (acc, expense) => {
      acc.total += expense.amount;
      acc.categories[expense.category] = 
        (acc.categories[expense.category] || 0) + expense.amount;
      return acc;
    },
    { total: 0, categories: {} }
  );

  // Categories for expenses
  const expenseCategories = [
    { value: "food", label: "🍔 Food" },
    { value: "transport", label: "🚗 Transport" },
    { value: "shopping", label: "🛍️ Shopping" },
    { value: "bills", label: "💡 Bills" },
    { value: "entertainment", label: "🎬 Entertainment" },
    { value: "health", label: "🏥 Health" },
    { value: "education", label: "📚 Education" },
    { value: "other", label: "📌 Other" }
  ];

  return (
    <div className="module-container">
      <h2>💰 Expense Tracker</h2>
      
      {/* New Expense Section */}
      <div className="expense-input">
        <div className="input-row">
          <label>
            Amount ($):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </label>
          
          <label>
            Category:
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {expenseCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div className="input-row">
          <label>
            Description:
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
            />
          </label>
          
          <label>
            Date:
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </label>
        </div>
        
        <button onClick={addExpense} disabled={!amount || isNaN(parseFloat(amount))}>
          Add Expense
        </button>
      </div>
      
      {/* Month Filter */}
      <div className="month-filter">
        <label>
          View Month:
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            max={format(new Date(), 'yyyy-MM')}
          />
        </label>
      </div>
      
      {/* Summary Section */}
      <div className="expense-summary">
        <h3>Summary for {format(parseISO(`${filterMonth}-01`), 'MMMM yyyy')}</h3>
        <p>Total Expenses: <strong>${monthlySummary.total.toFixed(2)}</strong></p>
        
        <div className="category-breakdown">
          <h4>By Category:</h4>
          <ul>
            {Object.entries(monthlySummary.categories).map(([cat, amount]) => (
              <li key={cat}>
                {expenseCategories.find(c => c.value === cat)?.label || cat}: 
                <strong> ${amount.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Expenses List */}
      <div className="expenses-list">
        <h3>Expense Records</h3>
        
        {filteredExpenses.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  {editingId === expense.id ? (
                    <>
                      <td>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{format(new Date(expense.date), 'MMM dd')}</td>
                      <td>
                        {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                      </td>
                      <td>{expense.description}</td>
                      <td>${expense.amount.toFixed(2)}</td>
                      <td>
                        <button onClick={() => startEdit(expense)}>Edit</button>
                        <button onClick={() => deleteExpense(expense.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">
            {expenses.length === 0 
              ? "No expenses recorded yet. Add your first expense above!" 
              : "No expenses for the selected month."}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;