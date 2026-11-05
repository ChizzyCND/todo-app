// 1. Find the elements on the page
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const clearDoneButton = document.querySelector("#clear-done");

// 2. Load saved tasks (or start with an empty list)
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// 3. Save the tasks in the browser
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// 4. Update the counter and the empty message
function updateInfo() {
  const remaining = tasks.filter((task) => !task.done).length;

  taskCount.textContent =
    remaining === 1 ? "1 task left" : `${remaining} tasks left`;

  emptyMessage.hidden = tasks.length > 0;
}

// 5. Show all the tasks on the page
function renderTasks() {
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const item = document.createElement("li");
    if (task.done) item.classList.add("done");

    const label = document.createElement("span");
    label.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);

    // Click the text: mark as done / not done
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

    item.appendChild(label);
    item.appendChild(deleteButton);
    list.appendChild(item);
  });

  updateInfo();
}

// 6. When the form is submitted, add a new task
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

// 7. "Clear completed" removes every task that is done
clearDoneButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

// 8. Show the saved tasks when the page opens
renderTasks();
