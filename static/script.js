// Task Functions
function createCheckbox(task) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.status === "complete";

    checkbox.addEventListener("change", () => {
        fetch("/update_status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task: task.name,
                status: checkbox.checked ? "complete" : "not started"
            })
        }).then(() => location.reload());
    });

    return checkbox;
}

function createEditIcon(task) {
    const editIcon = document.createElement("i");
    editIcon.className = "fas fa-pencil-alt";
    editIcon.title = "Edit";

    editIcon.addEventListener("click", () => {
        const newName = prompt("Edit task name:", task.name);
        if (newName && newName.trim() !== "") {
            fetch("/edit_task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ old: task.name, new: newName.trim() })
            }).then(() => location.reload());
        }
    });

    return editIcon;
}

function createTrashIcon(task) {
    const trashIcon = document.createElement("i");
    trashIcon.className = "fas fa-trash";
    trashIcon.title = "Delete";

    trashIcon.addEventListener("click", () => {
        if (confirm(`Delete "${task.name}"?`)) {
            fetch("/delete_task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task: task.name })
            }).then(() => location.reload());
        }
    });

    return trashIcon;
}

function renderTask(task, container){
    const li = document.createElement("li");
    li.className = "task-item";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.marginBottom = "8px";
    
    const checkbox = createCheckbox(task)

    const label = document.createElement("span");
    label.textContent = ` ${task.name}`;
    label.style.marginLeft = "8px";

    const editIcon = createEditIcon(task)
    const trashIcon = createTrashIcon(task)

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(editIcon);
    li.appendChild(trashIcon);
    container.appendChild(li);
}

// Main Functions
fetch("/get_tasks")
    .then(response => response.json())
    .then(data => {
        const taskList = document.getElementById("taskList");
        const completedList = document.getElementById("completedList");

        // Sort completed tasks by most recent
        const sortedCompleted = data.tasks
            .filter(task => task.status === "complete")
            .sort((a, b) => new Date(b.date_completed || 0) - new Date(a.date_completed || 0));

        const todoTasks = data.tasks.filter(task => task.status !== "complete");
   
        // Render to-do tasks
        todoTasks.forEach(task => renderTask(task, taskList));

        // Render completed tasks (sorted)
        sortedCompleted.forEach(task => renderTask(task, completedList));
    });

window.onload = () => {
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab === "completed") {
        document.getElementById("completedBtn").click();
    } else {
        document.getElementById("todoBtn").click(); // fallback default
    }
};


// UI Actions
document.getElementById("todoBtn").addEventListener("click", () => {
    localStorage.setItem("activeTab", "todo");
    document.getElementById("taskList").style.display = "block";
    document.getElementById("completedList").style.display = "none";
    document.getElementById("todoBtn").classList.add("active");
    document.getElementById("completedBtn").classList.remove("active");
    document.getElementById("addTaskBtn").style.display = "block";
});

document.getElementById("completedBtn").addEventListener("click", () => {
    localStorage.setItem("activeTab", "completed");
    document.getElementById("taskList").style.display = "none";
    document.getElementById("completedList").style.display = "block";
    document.getElementById("completedBtn").classList.add("active");
    document.getElementById("todoBtn").classList.remove("active");
    document.getElementById("addTaskBtn").style.display = "none";
});

// Add Task Button
document.getElementById("addTaskBtn").addEventListener("click", function () {
const task = prompt("What task would you like to add?");
if (task && task.trim() !== "") {
    fetch("/add_task", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ task: task.trim() })
    }).then(() => location.reload());
}
});

document.getElementById("addProjectBtn").addEventListener("click", function () {
    const project = prompt("What project would you like to add?");
    if (project && project.trim() !== "") {
        fetch("/add_project", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ project: project.trim() })
        }).then(() => location.reload());
    }
    });

document.getElementById("addNodeBtn").addEventListener("click", function () {
    const node = prompt("Node title?");
    if (node && node.trim() !== "") {
        fetch("/add_node", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ node: node.trim() })
        }).then(() => location.reload());
    }
    });

const menuButtons = document.querySelectorAll('.menuTab');
const pages = {
    "Tasks": document.getElementById("tasksPage"),
    "Projects": document.getElementById("projectsPage"),
    "Knowledge Base": document.getElementById("knowledgePage"),
    "Goals": document.getElementById("goalsPage"),
    "Progress": document.getElementById("progressPage"),
    "Calendar": document.getElementById("calendarPage"),
    "People": document.getElementById("peoplePage")
};

// Show the initial page (Tasks)
pages["Tasks"].style.display = "block";

// Add click listeners to menu buttons
menuButtons.forEach(button => {
    button.addEventListener("click", () => {
        const title = button.getAttribute("title");

        // Hide all pages
        Object.values(pages).forEach(page => page.style.display = "none");

        // Show selected page
        pages[title].style.display = "block";

        // Optional: highlight active tab
        menuButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
    });
});