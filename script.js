// 1. Find the elements on the page
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const clearDoneButton = document.querySelector("#clear-done");
const todayDate = document.querySelector("#today-date");
const progressBar = document.querySelector("#progress-bar");
const progressText = document.querySelector("#progress-text");

// 2. Show today's date, for example "Thursday 5 November"
todayDate.textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// 3. Load saved tasks (or start with an empty list)
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// 4. Save the tasks in the browser
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// 5. Update the counter, progress bar and empty message
function updateInfo() {
  const total = tasks.length;
  const remaining = tasks.filter((task) => !task.done).length;
  const completed = total - remaining;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  taskCount.textContent =
    remaining === 1 ? "1 task left" : `${remaining} tasks left`;

  progressBar.style.width = `${percent}%`;
  progressText.textContent =
    total === 0 ? "" : `${completed} of ${total} completed`;

  emptyMessage.hidden = total > 0;
}

// 6. Show all the tasks on the page
function renderTasks() {
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const item = document.createElement("li");
    if (task.done) item.classList.add("done");

    // The tick box
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark as done: ${task.text}`);

    const label = document.createElement("span");
    label.textContent = task.text;

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
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(deleteButton);
    list.appendChild(item);
  });

  updateInfo();
}

// 7. When the form is submitted, add a new task
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (text === "") return;

  tasks.push({ text: text, done: false });
  saveTasks();
  renderTasks();

  input.value = "";
  input.focus();
});

// 8. "Clear completed" removes every ticked task
clearDoneButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

// 9. Show the saved tasks when the page opens
renderTasks();
