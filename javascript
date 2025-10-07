document.addEventListener("DOMContentLoaded", loadTasks);

const taskInput = document.getElementById("task-input");
const taskTime = document.getElementById("task-time");
const taskCategory = document.getElementById("task-category");
const addTaskBtn = document.getElementById("add-task");
const tasksList = document.getElementById("tasks");
const currentDate = document.getElementById("current-date");
const emptyState = document.getElementById("empty-state");
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-tasks');
const totalTasksSpan = document.getElementById('total-tasks');
const completedTasksSpan = document.getElementById('completed-tasks');
const notification = document.getElementById('notification');

// Set current time as default
const now = new Date();
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
taskTime.value = `${hours}:${minutes}`;

// Show current date
currentDate.textContent = new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

// Add task
addTaskBtn.addEventListener("click", () => {
  const task = taskInput.value.trim();
  const time = taskTime.value;
  const category = taskCategory.value;

  if (!task || !time) {
    showNotification("Please enter both task and time!", "error");
    return;
  }

  const taskId = Date.now().toString();
  const taskObj = { 
    id: taskId,
    task, 
    time, 
    category,
    done: false, 
    important: false,
    createdAt: new Date().toISOString()
  };
  
  addTaskToDOM(taskObj);
  saveTask(taskObj);
  updateStats();
  
  taskInput.value = "";
  taskInput.focus();
  
  showNotification("Task added successfully!");
});

// Add task to DOM
function addTaskToDOM(taskObj) {
  const li = document.createElement("li");
  li.dataset.id = taskObj.id;
  li.dataset.category = taskObj.category;
  
  if (taskObj.done) li.classList.add("done");
  if (taskObj.important) li.classList.add("important");
  li.classList.add(taskObj.category);
  
  li.innerHTML = `
    <div class="task-info">
      <div class="task-text">${taskObj.task}</div>
      <div class="task-meta">
        <span class="task-time"><i class="fa-regular fa-clock"></i> ${formatTime(taskObj.time)}</span>
        <span class="task-category">${taskObj.category.charAt(0).toUpperCase() + taskObj.category.slice(1)}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="important-btn" title="Mark as important">
        <i class="fa${taskObj.important ? 's' : 'r'} fa-star"></i>
      </button>
      <button class="done-btn" title="Mark as done">
        <i class="fa${taskObj.done ? 's' : 'r'} fa-check-circle"></i>
      </button>
      <button class="edit-btn" title="Edit task">
        <i class="fa-regular fa-edit"></i>
      </button>
      <button class="delete-btn" title="Delete task">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;

  li.querySelector(".done-btn").addEventListener("click", () => toggleDone(taskObj, li));
  li.querySelector(".important-btn").addEventListener("click", () => toggleImportant(taskObj, li));
  li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(taskObj, li));
  li.querySelector(".edit-btn").addEventListener("click", () => editTask(taskObj, li));

  tasksList.appendChild(li);
  emptyState.style.display = "none";
}

// Format time for display
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Save task to localStorage
function saveTask(taskObj) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(taskObj);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  
  if (tasks.length === 0) {
    emptyState.style.display = "block";
  } else {
    tasks.forEach(addTaskToDOM);
  }
  
  updateStats();
  applyFilter('all');
}

// Toggle done status
function toggleDone(taskObj, li) {
  li.classList.toggle("done");
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const updatedTasks = tasks.map(t =>
    t.id === taskObj.id ? { ...t, done: !t.done } : t
  );
  localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  updateStats();
  showNotification("Task status updated!");
}

// Toggle important status
function toggleImportant(taskObj, li) {
  li.classList.toggle("important");
  const icon = li.querySelector(".important-btn i");
  icon.classList.toggle("fa-solid");
  icon.classList.toggle("fa-regular");
  
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const updatedTasks = tasks.map(t =>
    t.id === taskObj.id ? { ...t, important: !t.important } : t
  );
  localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  showNotification("Task importance updated!");
}

// Edit task
function editTask(taskObj, li) {
  const taskText = li.querySelector(".task-text");
  const currentText = taskText.textContent;
  
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.className = "edit-input";
  input.style.cssText = "width: 100%; padding: 8px; border: 1px solid #3498db; border-radius: 5px; font-size: 1rem;";
  
  taskText.innerHTML = "";
  taskText.appendChild(input);
  input.focus();
  
  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText && newText !== currentText) {
      taskText.textContent = newText;
      
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const updatedTasks = tasks.map(t =>
        t.id === taskObj.id ? { ...t, task: newText } : t
      );
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      showNotification("Task updated successfully!");
    } else {
      taskText.textContent = currentText;
    }
  };
  
  input.addEventListener("blur", saveEdit);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveEdit();
    }
  });
}

// Delete task
function deleteTask(taskObj, li) {
  li.style.opacity = "0";
  li.style.transform = "translateX(50px)";
  
  setTimeout(() => {
    li.remove();
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const updatedTasks = tasks.filter(t => t.id !== taskObj.id);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    
    if (updatedTasks.length === 0) {
      emptyState.style.display = "block";
    }
    
    updateStats();
    showNotification("Task deleted!");
  }, 300);
}

// Update task statistics
function updateStats() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const completed = tasks.filter(t => t.done).length;
  
  totalTasksSpan.textContent = `Total: ${tasks.length} tasks`;
  completedTasksSpan.textContent = `Completed: ${completed} tasks`;
}

// Filter tasks
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

function applyFilter(filter) {
  const tasks = document.querySelectorAll('.task-list li');
  
  tasks.forEach(task => {
    switch(filter) {
      case 'pending':
        task.style.display = task.classList.contains('done') ? 'none' : 'flex';
        break;
      case 'completed':
        task.style.display = task.classList.contains('done') ? 'flex' : 'none';
        break;
      default:
        task.style.display = 'flex';
    }
  });
}

// Sort tasks
sortSelect.addEventListener('change', () => {
  const sortBy = sortSelect.value;
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  
  let sortedTasks;
  switch(sortBy) {
    case 'time':
      sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
      break;
    case 'category':
      sortedTasks = [...tasks].sort((a, b) => a.category.localeCompare(b.category));
      break;
    case 'added':
    default:
      sortedTasks = [...tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  
  tasksList.innerHTML = '';
  sortedTasks.forEach(addTaskToDOM);
});

// Show notification
function showNotification(message, type = "success") {
  const icon = notification.querySelector("i");
  notification.textContent = message;
  notification.className = "notification";
  
  if (type === "error") {
    notification.classList.add("error");
    icon.className = "fas fa-exclamation-circle";
  } else {
    notification.classList.remove("error");
    icon.className = "fas fa-check-circle";
  }
  
  // Add the icon back
  notification.prepend(icon);
  
  notification.classList.add("show");
  
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}
