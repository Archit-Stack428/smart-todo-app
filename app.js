// --- Smart Todo Application Logic ---

// --- 1. Global State Configuration ---
let tasks = [];
let currentFilter = 'all'; // 'all', 'active', 'completed'
let selectedCategory = null; // null or String ('Work', 'Personal', etc.)
let searchQuery = '';
let sortBy = 'created'; // 'created', 'priority', 'due'

// Default tasks for first-time users
const DEFAULT_TASKS = [
    {
        id: 'default-1',
        title: 'Welcome to Smart Todo! 👋',
        category: 'Personal',
        priority: 'Low',
        dueDate: '',
        completed: false,
        createdAt: Date.now() - 100000
    },
    {
        id: 'default-2',
        title: 'Try creating a new task below 📝',
        category: 'Work',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0], // Today's date
        completed: false,
        createdAt: Date.now() - 50000
    },
    {
        id: 'default-3',
        title: 'Check off completed tasks to see progress grow! 📈',
        category: 'Health',
        priority: 'High',
        dueDate: '',
        completed: true,
        createdAt: Date.now() - 10000
    }
];

// --- 2. DOM Elements Selection ---
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoCategory = document.getElementById('todo-category');
const todoPriority = document.getElementById('todo-priority');
const todoDate = document.getElementById('todo-date');
const taskList = document.getElementById('task-list');

const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const clearCompletedBtn = document.getElementById('clear-completed');

const progressRatio = document.getElementById('progress-ratio');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressFeedback = document.getElementById('progress-feedback');

const themeSwitch = document.getElementById('theme-switch');
const themeLight = document.getElementById('theme-light');
const themeDark = document.getElementById('theme-dark');

// Navigation filter buttons
const statusFilterButtons = document.querySelectorAll('[data-filter]');
const categoryFilterButtons = document.querySelectorAll('[data-category]');

// Sidebar count badges
const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const countWork = document.getElementById('count-work');
const countPersonal = document.getElementById('count-personal');
const countShopping = document.getElementById('count-shopping');
const countHealth = document.getElementById('count-health');

// --- 3. App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadTasks();
    setupEventListeners();
    render();
});

// --- 4. Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
        themeLight.classList.remove('active');
        themeDark.classList.add('active');
    } else {
        themeDark.classList.remove('active');
        themeLight.classList.add('active');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// --- 5. Data Storage Logic ---
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    } else {
        // First load gets default example items
        tasks = [...DEFAULT_TASKS];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// --- 6. Task Management Operations ---
function addTask(title, category, priority, dueDate) {
    const newTask = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        title: title.trim(),
        category,
        priority,
        dueDate,
        completed: false,
        createdAt: Date.now()
    };

    tasks.push(newTask);
    saveTasks();
    render();
}

function toggleTaskComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    render();
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        // Apply smooth fade-out animation first
        taskElement.classList.add('slide-out');
        taskElement.addEventListener('animationend', () => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            render();
        });
    } else {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        render();
    }
}

function clearCompleted() {
    // Collect all completed task IDs that match the active view
    const completedTasksToClear = tasks.filter(task => task.completed);
    
    if (completedTasksToClear.length === 0) return;

    // Animate all of them out
    completedTasksToClear.forEach(task => {
        const taskElement = document.querySelector(`[data-id="${task.id}"]`);
        if (taskElement) {
            taskElement.classList.add('slide-out');
        }
    });

    // Wait for the slide-out animation to complete, then update State
    setTimeout(() => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        render();
    }, 250);
}

// --- 7. Event Listener Handlers ---
function setupEventListeners() {
    // Add Todo Form Submit
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = todoInput.value;
        const category = todoCategory.value;
        const priority = todoPriority.value;
        const dueDate = todoDate.value;

        if (title.trim() === '') return;

        addTask(title, category, priority, dueDate);
        
        // Reset only the title input to make consecutive additions easy
        todoInput.value = '';
        todoDate.value = '';
    });

    // Theme Switch Click Handler
    themeSwitch.addEventListener('click', toggleTheme);

    // Live Search Keyup
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        render(false); // Render without full transition resets
    });

    // Sorting Dropdown Selector
    sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        render();
    });

    // Clear Completed Button Click
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Status Filter Navigation Click Buttons
    statusFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            statusFilterButtons.forEach(b => b.classList.remove('active'));
            categoryFilterButtons.forEach(b => b.classList.remove('active'));
            
            // Set active filters
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            selectedCategory = null; // Clear category filter if status filter is clicked
            
            render();
        });
    });

    // Category Filter Navigation Click Buttons
    categoryFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            statusFilterButtons.forEach(b => b.classList.remove('active'));
            
            const isAlreadyActive = btn.classList.contains('active');
            categoryFilterButtons.forEach(b => b.classList.remove('active'));
            
            if (isAlreadyActive) {
                // If clicking an active category filter again, toggle it off and go back to All Tasks
                selectedCategory = null;
                currentFilter = 'all';
                document.querySelector('[data-filter="all"]').classList.add('active');
            } else {
                btn.classList.add('active');
                selectedCategory = btn.getAttribute('data-category');
                currentFilter = null; // Clear status filter if category is selected
            }
            
            render();
        });
    });
}

// --- 8. Statistics and Badges Calculations ---
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    // 1. Update Progress Card Numbers
    progressRatio.textContent = `${completed} / ${total}`;
    
    // 2. Update Progress Bar Fill Width
    const fillPercent = total > 0 ? (completed / total) * 100 : 0;
    progressBarFill.style.width = `${fillPercent}%`;
    
    // 3. Update Progress Feedback Text Dynamically
    if (total === 0) {
        progressFeedback.textContent = "No tasks added yet. Start planning!";
    } else if (fillPercent === 100) {
        progressFeedback.textContent = "All tasks completed! Awesome job! 🎉";
    } else if (fillPercent >= 75) {
        progressFeedback.textContent = "Almost there! Finish the remaining tasks!";
    } else if (fillPercent >= 40) {
        progressFeedback.textContent = "Great momentum! Keep ticking them off.";
    } else if (fillPercent > 0) {
        progressFeedback.textContent = "Good start! Let's get things done today.";
    } else {
        progressFeedback.textContent = "No progress yet. Let's make it happen!";
    }

    // 4. Update Category and Status Badge Counters
    countAll.textContent = total;
    countActive.textContent = tasks.filter(t => !t.completed).length;
    countCompleted.textContent = completed;
    
    countWork.textContent = tasks.filter(t => t.category === 'Work').length;
    countPersonal.textContent = tasks.filter(t => t.category === 'Personal').length;
    countShopping.textContent = tasks.filter(t => t.category === 'Shopping').length;
    countHealth.textContent = tasks.filter(t => t.category === 'Health').length;
}

// --- 9. Filter and Sort Logic ---
function getFilteredAndSortedTasks() {
    let result = [...tasks];

    // Filter by text search
    if (searchQuery.trim() !== '') {
        result = result.filter(task => task.title.toLowerCase().includes(searchQuery));
    }

    // Filter by status (All, Active, Completed)
    if (currentFilter === 'active') {
        result = result.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        result = result.filter(task => task.completed);
    }

    // Filter by sidebar category selection
    if (selectedCategory) {
        result = result.filter(task => task.category === selectedCategory);
    }

    // Sort operations
    if (sortBy === 'created') {
        // Newest tasks first
        result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'priority') {
        // Sort weight order: High = 3, Medium = 2, Low = 1
        const weights = { High: 3, Medium: 2, Low: 1 };
        result.sort((a, b) => weights[b.priority] - weights[a.priority]);
    } else if (sortBy === 'due') {
        // Tasks with due dates come first sorted ascending, tasks without come last
        result.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    return result;
}

// --- 10. Rendering UI ---
function render(animateList = true) {
    updateStatistics();
    
    const displayTasks = getFilteredAndSortedTasks();
    
    // Clear list
    taskList.innerHTML = '';

    // If list is empty, show design empty state card
    if (displayTasks.length === 0) {
        const emptyStateHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H9.75M8.25 21h8.25a2.25 2.25 0 002.25-2.25V5.75A2.25 2.25 0 0016.5 3.5h-9A2.25 2.25 0 005.25 5.75v13a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div class="empty-state-title">No tasks found</div>
                <div class="empty-state-description">Try adjusting your filters or add a new task to get started.</div>
            </div>
        `;
        taskList.innerHTML = emptyStateHTML;
        return;
    }

    // Generate HTML for each task
    displayTasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.setAttribute('data-id', task.id);
        
        // Prevent list entrance slide animation if we just typed in search to avoid annoying layout flashes
        if (!animateList) {
            taskItem.style.animation = 'none';
        }

        // Formatting date
        let dateHTML = '';
        if (task.dueDate) {
            const dateObj = new Date(task.dueDate);
            const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            // Highlight overdue tasks in red
            const todayStr = new Date().toISOString().split('T')[0];
            const isOverdue = !task.completed && task.dueDate < todayStr;
            const dateStyle = isOverdue ? 'color: var(--danger); font-weight: 600;' : '';

            dateHTML = `
                <span class="task-date" style="${dateStyle}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                    </svg>
                    ${formattedDate}
                </span>
            `;
        }

        // Setting Category Badge class helper
        const catClass = `badge-cat-${task.category.toLowerCase()}`;
        // Setting Priority Badge class helper
        const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;

        taskItem.innerHTML = `
            <div class="task-left">
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-details">
                    <span class="task-title" title="${task.title}">${task.title}</span>
                    <div class="task-meta">
                        <span class="badge ${catClass}">${task.category}</span>
                        <span class="badge ${priorityClass}">${task.priority}</span>
                        ${dateHTML}
                    </div>
                </div>
            </div>
            <div class="task-right">
                <button class="action-btn delete-btn" title="Delete Task">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        `;

        // Handle Checkbox Change (Complete/Incomplete toggling)
        const checkbox = taskItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            toggleTaskComplete(task.id);
        });

        // Handle Delete Button Click
        const deleteBtn = taskItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id);
        });

        taskList.appendChild(taskItem);
    });
}
