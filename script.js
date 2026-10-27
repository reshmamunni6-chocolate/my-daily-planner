const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskDate = document.querySelector("#taskDate");
const taskPriority = document.querySelector("#taskPriority");
const taskList = document.querySelector("#taskList");
const taskFilter = document.querySelector("#taskFilter");
const emptyMessage = document.querySelector("#emptyMessage");
const totalCount = document.querySelector("#totalCount");
const completedCount = document.querySelector("#completedCount");
const remainingCount = document.querySelector("#remainingCount");
const submitBtn = document.querySelector("#submitBtn");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const formHeading = document.querySelector("#formHeading");
const taskStatus = document.querySelector("#taskStatus");
const clearCompletedBtn = document.querySelector("#clearCompletedBtn");

const STORAGE_KEY = "myDailyPlannerTasks";
let tasks = loadTasks();
let editingId = null;

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("Could not load saved tasks.", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    alert("Your browser could not save tasks. Please check your browser storage settings.");
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric", month: "short", year: "numeric"
  }).format(date);
}

function makeButton(label, className, action, taskId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.setAttribute("aria-label", `${label} task`);
  button.addEventListener("click", () => action(taskId));
  return button;
}

function renderTasks() {
  taskList.replaceChildren();
  const filter = taskFilter.value;
  const visibleTasks = tasks.filter(task => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  visibleTasks.sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    const dateA = a.date || "9999-12-31";
    const dateB = b.date || "9999-12-31";
    return dateA.localeCompare(dateB);
  });

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "remaining" : "completed"}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const date = document.createElement("span");
    date.textContent = formatDate(task.date);
    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = `${task.priority} priority`;
    meta.append(date, priority);
    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      makeButton("Edit", "icon-btn", startEdit, task.id),
      makeButton("Delete", "icon-btn", deleteTask, task.id)
    );
    item.append(checkbox, content, actions);
    taskList.append(item);
  });

  const completed = tasks.filter(task => task.completed).length;
  totalCount.textContent = tasks.length;
  completedCount.textContent = completed;
  remainingCount.textContent = tasks.length - completed;
  emptyMessage.classList.toggle("hidden", visibleTasks.length > 0);
  if (visibleTasks.length === 0) {
    emptyMessage.textContent = tasks.length === 0
      ? "No tasks yet. Add your first task above!"
      : "No tasks match this filter.";
  }
  taskStatus.textContent = tasks.length
    ? `${tasks.length - completed} task${tasks.length - completed === 1 ? "" : "s"} left to do`
    : "Stay organized, one task at a time.";
  clearCompletedBtn.disabled = completed === 0;
  clearCompletedBtn.style.opacity = completed === 0 ? "0.5" : "1";
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  if (editingId) {
    tasks = tasks.map(task => task.id === editingId
      ? { ...task, title, date: taskDate.value, priority: taskPriority.value }
      : task);
  } else {
    tasks.push({
      id: createId(),
      title,
      date: taskDate.value,
      priority: taskPriority.value,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  saveTasks();
  resetForm();
  renderTasks();
});

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task || !confirm(`Delete "${task.title}"?`)) return;
  tasks = tasks.filter(item => item.id !== id);
  if (editingId === id) resetForm();
  saveTasks();
  renderTasks();
}

function startEdit(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  editingId = id;
  taskInput.value = task.title;
  taskDate.value = task.date || "";
  taskPriority.value = task.priority;
  formHeading.textContent = "Edit task";
  submitBtn.textContent = "Save changes";
  cancelEditBtn.classList.remove("hidden");
  taskInput.focus();
  document.querySelector(".panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  editingId = null;
  taskForm.reset();
  taskPriority.value = "Medium";
  formHeading.textContent = "Add a task";
  submitBtn.textContent = "＋ Add task";
  cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", resetForm);
taskFilter.addEventListener("change", renderTasks);
clearCompletedBtn.addEventListener("click", () => {
  const completedCountNow = tasks.filter(task => task.completed).length;
  if (!completedCountNow) return;
  if (!confirm(`Clear ${completedCountNow} completed task${completedCountNow === 1 ? "" : "s"}?`)) return;
  tasks = tasks.filter(task => !task.completed);
  if (editingId && !tasks.some(task => task.id === editingId)) resetForm();
  saveTasks();
  renderTasks();
});

renderTasks();
