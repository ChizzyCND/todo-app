// 1. Find the elements on the page
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const dueInput = document.querySelector("#due-input");
const priorityInput = document.querySelector("#priority-input");
const categoryInput = document.querySelector("#category-input");
const categoryList = document.querySelector("#category-list");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const clearDoneButton = document.querySelector("#clear-done");
const todayDate = document.querySelector("#today-date");
const progressBar = document.querySelector("#progress-bar");
const progressText = document.querySelector("#progress-text");

// The filter controls
const statusButtons = document.querySelectorAll("#status-filter .chip");
const filterPriority = document.querySelector("#filter-priority");
const filterCategory = document.querySelector("#filter-category");
const filterDue = document.querySelector("#filter-due");
const sortBy = document.querySelector("#sort-by");

// 2. Show today's date, for example "Thursday 5 November"
todayDate.textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// 3. Load saved tasks (or start with an empty list)
// Older tasks only have "text" and "done". The missing details
// (due, priority, category) are handled with defaults further down.
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Which status button is selected: "all", "active" or "done"
let statusFilter = "all";

// Lower number = more important
const priorityOrder = { high: 0, medium: 1, low: 2 };

// 4. Save the tasks in the browser
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// 5. Date helpers
// How many days from today is this date? (0 = today, -1 = yesterday)
function daysUntil(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

// Turn a deadline into text and a style, for example "Due tomorrow"
function describeDue(task) {
  if (!task.due) return null;

  const days = daysUntil(task.due);
  const open = !task.done; // finished tasks are never shown as urgent

  if (days < 0) {
    const unit = days === -1 ? "day" : "days";
    return {
      text: `Overdue by ${-days} ${unit}`,
      style: open ? "overdue" : "",
    };
  }
  if (days === 0) return { text: "Due today", style: open ? "soon" : "" };
  if (days === 1) return { text: "Due tomorrow", style: open ? "soon" : "" };

  const [year, month, day] = task.due.split("-").map(Number);
  const nice = new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return { text: `Due ${nice}`, style: "" };
}

// 6. Work out which tasks to show (filters and sorting)
function getVisibleTasks() {
  const visible = tasks.filter((task) => {
    const priority = task.priority || "medium";

    if (statusFilter === "active" && task.done) return false;
    if (statusFilter === "done" && !task.done) return false;
    if (filterPriority.value && priority !== filterPriority.value) return false;
    if (filterCategory.value && task.category !== filterCategory.value)
      return false;

    if (filterDue.value === "none") return !task.due;
    if (filterDue.value) {
      if (!task.due) return false;
      const days = daysUntil(task.due);
      if (filterDue.value === "overdue") return days < 0 && !task.done;
      if (filterDue.value === "today") return days === 0;
      if (filterDue.value === "week") return days >= 0 && days <= 7;
    }
    return true;
  });

  // Earliest deadline first, and tasks with no deadline last
  function byDeadline(a, b) {
    if (a.due === b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  }

  function byPriority(a, b) {
    return (
      priorityOrder[a.priority || "medium"] -
      priorityOrder[b.priority || "medium"]
    );
  }

  visible.sort((a, b) => {
    // Finished tasks always go to the bottom
    if (a.done !== b.done) return a.done ? 1 : -1;

    if (sortBy.value === "priority")
      return byPriority(a, b) || byDeadline(a, b);
    if (sortBy.value === "newest") return tasks.indexOf(b) - tasks.indexOf(a);
    return byDeadline(a, b) || byPriority(a, b);
  });

  return visible;
}

// 7. Fill the category suggestions and the category filter
function updateCategories() {
  const categories = [];
  tasks.forEach((task) => {
    if (task.category && !categories.includes(task.category)) {
      categories.push(task.category);
    }
  });
  categories.sort((a, b) => a.localeCompare(b));

  categoryList.innerHTML = "";
  categories.forEach((name) => categoryList.appendChild(new Option(name)));

  // Keep the selected category if it still exists
  const selected = filterCategory.value;
  filterCategory.innerHTML = "";
  filterCategory.appendChild(new Option("All categories", ""));
  categories.forEach((name) =>
    filterCategory.appendChild(new Option(name, name)),
  );
  filterCategory.value = categories.includes(selected) ? selected : "";
}

// 8. Update the counter, progress bar and empty message
function updateInfo(shownCount) {
  const total = tasks.length;
  const remaining = tasks.filter((task) => !task.done).length;
  const completed = total - remaining;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  taskCount.textContent =
    remaining === 1 ? "1 task left" : `${remaining} tasks left`;

  progressBar.style.width = `${percent}%`;
  progressText.textContent =
    total === 0 ? "" : `${completed} of ${total} completed`;

  // Show a message when nothing is on the list
  emptyMessage.hidden = shownCount > 0;
  emptyMessage.querySelector("p").textContent =
    total === 0
      ? "No tasks yet. Add one above!"
      : "No tasks match these filters.";
}

// 9. Show the tasks on the page
function renderTasks() {
  updateCategories();
  list.innerHTML = "";

  const visibleTasks = getVisibleTasks();

  visibleTasks.forEach((task) => {
    const priority = task.priority || "medium";

    const item = document.createElement("li");
    item.classList.add(`priority-${priority}`);
    if (task.done) item.classList.add("done");

    // The tick box
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark as done: ${task.text}`);

    // The text, with a line underneath for priority, category and deadline
    const main = document.createElement("div");
    main.className = "task-main";

    const label = document.createElement("span");
    label.className = "task-text";
    label.textContent = task.text;

    const details = document.createElement("div");
    details.className = "task-meta";

    const badge = document.createElement("span");
    badge.className = `badge badge-${priority}`;
    badge.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
    details.appendChild(badge);

    if (task.category) {
      const category = document.createElement("span");
      category.className = "category";
      category.textContent = task.category;
      details.appendChild(category);
    }

    const due = describeDue(task);
    if (due) {
      const dueLabel = document.createElement("span");
      dueLabel.className = `due ${due.style}`.trim();
      dueLabel.textContent = due.text;
      details.appendChild(dueLabel);
    }

    main.appendChild(label);
    main.appendChild(details);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);

    // Tick or untick the box: mark as done / not done
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    // Clicking the text does the same thing
    label.addEventListener("click", () => {
      task.done = !task.done;
      saveTasks();
      renderTasks();
    });

    // Click Delete: remove this task
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((other) => other !== task);
      saveTasks();
      renderTasks();
    });

    item.appendChild(checkbox);
    item.appendChild(main);
    item.appendChild(deleteButton);
    list.appendChild(item);
  });

  updateInfo(visibleTasks.length);
}

// 10. When the form is submitted, add a new task
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (text === "") return;

  tasks.push({
    text: text,
    done: false,
    due: dueInput.value,
    priority: priorityInput.value,
    category: categoryInput.value.trim(),
  });
  saveTasks();
  renderTasks();

  form.reset();
  priorityInput.value = "medium";
  input.focus();
});

// 11. Status buttons: All / Active / Completed
statusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    statusFilter = button.dataset.status;
    statusButtons.forEach((other) => {
      other.setAttribute("aria-pressed", other === button);
    });
    renderTasks();
  });
});

// 12. Changing any filter or the sort order updates the list
[filterPriority, filterCategory, filterDue, sortBy].forEach((control) => {
  control.addEventListener("change", renderTasks);
});

// 13. "Clear completed" removes every ticked task
clearDoneButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

// 14. Show the saved tasks when the page opens
renderTasks();
