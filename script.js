/**
 * TASK MANAGER APPLICATION LOGIC
 * ==============================
 * 
 * Architecture Pattern: Modular vanilla JavaScript (ES6+)
 * Similar to a small ViewModel or Code-Behind in C# desktop apps.
 * 
 * Concepts mapped to C# equivalents:
 * - let/const  → variable declarations (var but block-scoped like C#)
 * - Arrays     → List<T>
 * - Objects    → anonymous types or classes
 * - Functions  → methods
 * - Event Listeners → EventHandler += (subscription)
 * - localStorage → isolated storage or Settings
 * - DOM manipulation → modifying UI controls programmatically
 */

// ==========================================
// I. STATE MANAGEMENT
// ==========================================

/**
 * Application State
 * Like a ViewModel or State container class in C#.
 * Holds the source of truth for the application.
 */
const appState = {
    /**
     * Tasks Array
     * Stores task objects in memory (like List<TaskItem>).
     * Each task: { id: number, text: string, priority: string, completed: boolean, createdAt: Date }
     */
    tasks: [],
    
    /**
     * Current Filter
     * Like a property determining ListView filter.
     */
    filter: 'all', // 'all' | 'active' | 'completed'
    
    /**
     * Getter for filtered tasks (calculated property)
     * Like a Linq query or filtered ICollectionView.
     * @returns {Array} Filtered task array
     */
    get filteredTasks() {
        switch(this.filter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return [...this.tasks]; // Return copy (like ToList())
        }
    },
    
    /**
     * Statistics calculation
     * Like computed properties in MVVM.
     */
    get stats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        return { total, completed, pending };
    }
};

// ==========================================
// II. DOM ELEMENT REFERENCES
// ==========================================
/**
 * Caching DOM queries for performance.
 * Like finding controls by Name in the XAML/code-behind 
 * and storing them in private fields.
 */

const domElements = {
    // Form elements
    form: document.getElementById('task-form'),
    input: document.getElementById('task-input'),
    prioritySelect: document.getElementById('priority-select'),
    
    // List elements
    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('empty-state'),
    taskCount: document.getElementById('task-count'),
    
    // Template/Container references
    statsContainer: document.getElementById('task-stats')
};

// ==========================================
// III. INITIALIZATION (CONSTRUCTOR EQUIVALENT)
// ==========================================

/**
 * Initialize the application.
 * Called when DOM is fully loaded.
 * Similar to Window_Loaded or Form constructor in C#.
 */
function initializeApp() {
    console.log('Task Manager initialized');
    
    // Load saved data (like loading from Settings/ isolated storage)
    loadTasksFromStorage();
    
    // Initial render (like initial data binding)
    render();
    
    // Event binding (like registering event handlers)
    attachEventListeners();
}

// ==========================================
// IV. EVENT HANDLERS
// ==========================================

/**
 * Attach all event listeners.
 * Like wiring up button clicks and text changes in the designer.
 */
function attachEventListeners() {
    // Form submission (like Button_Click)
    domElements.form.addEventListener('submit', handleFormSubmit);
    
    // Delegate event for dynamic elements (like handling clicks in a ListView)
    // Instead of adding listener to each task item, we add one to the parent
    domElements.taskList.addEventListener('click', handleTaskListClick);
    
    // Delegate change events (checkboxes)
    domElements.taskList.addEventListener('change', handleTaskListChange);
    
    // Keyboard shortcuts (like KeyDown events)
    document.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Handle form submission
 * @param {Event} event - The submit event object (like RoutedEventArgs)
 */
function handleFormSubmit(event) {
    // Prevent default form submission (HTTP POST/page reload)
    // Like e.Handled = true in C# event handlers
    event.preventDefault();
    
    // Get values from inputs (like textBox.Text, comboBox.SelectedValue)
    const text = domElements.input.value.trim();
    const priority = domElements.prioritySelect.value;
    
    // Validation (like ModelState validation)
    if (!text) {
        // Early return pattern (like ArgumentNullException.ThrowIfNull)
        showError('Please enter a task description');
        domElements.input.focus();
        return;
    }
    
    // Create new task object (like creating a new ViewModel instance)
    const newTask = {
        id: generateId(),           // Like Guid.NewGuid() but simpler
        text: text,
        priority: priority,         // 'low', 'medium', or 'high'
        completed: false,
        createdAt: new Date()
    };
    
    // Add to state (like ObservableCollection.Add)
    appState.tasks.push(newTask);
    
    // Persist changes (like saving Settings)
    saveTasksToStorage();
    
    // Clear input (reset form)
    domElements.input.value = '';
    domElements.input.focus();  // Keep focus for rapid entry
    
    // Re-render UI (like calling Refresh() or PropertyChanged notifications)
    render();
}

/**
 * Handle clicks within the task list (Event Delegation)
 * @param {Event} event 
 */
function handleTaskListClick(event) {
    // Find closest delete button ancestor
    // Like finding which ListViewItem was clicked
    const deleteBtn = event.target.closest('.btn-delete');
    
    if (deleteBtn) {
        // Get task ID from data attribute
        // Like getting DataContext or Tag property
        const taskId = parseInt(deleteBtn.dataset.id, 10);
        deleteTask(taskId);
    }
}

/**
 * Handle changes within task list (checkboxes)
 * @param {Event} event 
 */
function handleTaskListChange(event) {
    if (event.target.classList.contains('task-checkbox')) {
        const taskId = parseInt(event.target.dataset.id, 10);
        toggleTaskComplete(taskId);
    }
}

/**
 * Global keyboard shortcuts
 * @param {KeyboardEvent} event 
 */
function handleGlobalKeydown(event) {
    // Escape key clears focus or cancels current operation
    if (event.key === 'Escape') {
        domElements.input.blur();  // Remove focus
    }
    
    // Ctrl+A or Cmd+A to focus input (like shortcuts in VS)
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        domElements.input.focus();
    }
}

// ==========================================
// V. BUSINESS LOGIC / DATA OPERATIONS
// ==========================================

/**
 * Delete a task by ID
 * @param {number} id - Task identifier to delete
 */
function deleteTask(id) {
    // Find index (like FindIndex or IndexOf with predicate)
    const index = appState.tasks.findIndex(t => t.id === id);
    
    if (index > -1) {
        // Remove from array (like RemoveAt)
        appState.tasks.splice(index, 1);
        
        // Save and refresh
        saveTasksToStorage();
        render();
    }
}

/**
 * Toggle task completion status
 * @param {number} id - Task identifier to toggle
 */
function toggleTaskComplete(id) {
    // Find task (like FirstOrDefault)
    const task = appState.tasks.find(t => t.id === id);
    
    if (task) {
        // Toggle boolean (like !property)
        task.completed = !task.completed;
        
        // Optional: Move completed items to bottom (sorting)
        // Like OrderBy(t => t.completed)
        appState.tasks.sort((a, b) => a.completed - b.completed);
        
        saveTasksToStorage();
        render();
    }
}

/**
 * Generate unique ID
 * Simple timestamp-based ID (like ticks)
 * @returns {number}
 */
function generateId() {
    return Date.now();  // Milliseconds since Unix epoch
}

/**
 * Show error message (could be expanded to toast notifications)
 * @param {string} message 
 */
function showError(message) {
    // Simple alert - in production, use a toast notification system
    // Like MessageBox.Show or a custom notification service
    alert(message);
}

// ==========================================
// VI. RENDERING / UI UPDATES
// ==========================================

/**
 * Main render function - updates entire UI based on state
 * Like OnPropertyChanged or View refresh calls
 */
function render() {
    renderTaskList();
    renderStats();
}

/**
 * Render the task list items
 * Similar to ItemsSource binding with DataTemplate in WPF
 */
function renderTaskList() {
    const { taskList, emptyState } = domElements;
    const tasks = appState.filteredTasks;
    
    // Clear current list (like Items.Clear())
    // Keep emptyState in memory but remove other items
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        // Show empty state (like EmptyDataTemplate)
        emptyState.style.display = 'flex';
        taskList.appendChild(emptyState);
    } else {
        // Hide empty state from DOM (but keep reference)
        emptyState.style.display = 'none';
        
        // Create fragment for performance (like using Virtualization)
        // Reduces reflows compared to adding each item individually
        const fragment = document.createDocumentFragment();
        
        tasks.forEach(task => {
            // Create DOM element for each task (like DataTemplate.LoadContent)
            const taskElement = createTaskElement(task);
            fragment.appendChild(taskElement);
        });
        
        taskList.appendChild(fragment);
    }
}

/**
 * Create DOM element for a single task
 * Like a DataTemplate or UserControl instantiation
 * @param {Object} task - Task data object
 * @returns {HTMLElement} - List item element
 */
function createTaskElement(task) {
    // Create elements (like new ListViewItem())
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'task-item--completed' : ''}`;
    li.dataset.priority = task.priority;  // Custom data attribute
    
    // Priority label mapping (like a ValueConverter)
    const priorityLabels = {
        low: 'Low',
        medium: 'Medium',
        high: 'High'
    };
    
    const priorityClass = `priority-${task.priority}`;
    
    // Build inner HTML (like XAML composition)
    // Template literal (backticks) allow string interpolation (like $"text {variable}")
    li.innerHTML = `
        <div class="task-content">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                data-id="${task.id}"
                ${task.completed ? 'checked' : ''}
                aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
            >
            <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <span class="task-priority ${priorityClass}">${priorityLabels[task.priority]}</span>
        <button 
            type="button" 
            class="btn-delete" 
            data-id="${task.id}"
            aria-label="Delete task: ${escapeHtml(task.text)}"
            title="Delete task"
        >
            ×
        </button>
    `;
    
    return li;
}

/**
 * Render statistics
 * Updates the task counter display
 */
function renderStats() {
    const { pending, total } = appState.stats;
    
    let text;
    if (total === 0) {
        text = 'No tasks';
    } else if (pending === 0) {
        text = 'All tasks completed! 🎉';
    } else {
        text = `${pending} of ${total} task${total !== 1 ? 's' : ''} pending`;
    }
    
    domElements.taskCount.textContent = text;
}

// ==========================================
// VII. STORAGE / PERSISTENCE
// ==========================================

const STORAGE_KEY = 'taskManager_v1_data';

/**
 * Save to localStorage
 * Like saving to Application Settings or SQLite
 */
function saveTasksToStorage() {
    try {
        // Serialize to JSON (like JsonSerializer.Serialize)
        const data = JSON.stringify(appState.tasks);
        localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
        console.error('Failed to save tasks:', error);
        // Graceful degradation - app works without storage
    }
}

/**
 * Load from localStorage
 * Like loading from Application Settings
 */
function loadTasksFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            // Deserialize (like JsonSerializer.Deserialize<List<Task>>)
            const parsed = JSON.parse(data);
            
            // Validation - ensure it's an array
            if (Array.isArray(parsed)) {
                appState.tasks = parsed;
            }
        }
    } catch (error) {
        console.error('Failed to load tasks:', error);
        // Continue with empty array
        appState.tasks = [];
    }
}

// ==========================================
// VIII. UTILITIES
// ==========================================

/**
 * Escape HTML to prevent XSS attacks
 * Never insert user input directly into innerHTML without sanitization!
 * Like HtmlEncode in ASP.NET WebForms
 * @param {string} text 
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;  // textContent auto-escapes HTML
    return div.innerHTML;
}

// ==========================================
// IX. APPLICATION ENTRY POINT
// ==========================================

/**
 * DOMContentLoaded ensures HTML is parsed before scripts run
 * Like Form.Load or Window.Initialized
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

/**
 * Optional: Expose appState for debugging
 * Like making internal variables visible in Debug mode
 * Access in browser console via window.debugState
 */
window.debugState = appState;