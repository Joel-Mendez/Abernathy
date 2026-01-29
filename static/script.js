// Task Functions
function createCheckbox(task) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.status === "complete";

    checkbox.addEventListener("change", () => {
        fetch(`/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
            fetch(`/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() })
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
            fetch(`/tasks/${task.id}`, { method: "DELETE" })
                .then(() => location.reload());
        }
    });

    return trashIcon;
}

let projectsCache = [];

function createAssignIcon(task) {
    const assignIcon = document.createElement("i");
    assignIcon.className = "fas fa-folder";
    assignIcon.title = "Assign to project";

    assignIcon.addEventListener("click", () => {
        if (!projectsCache || projectsCache.length === 0) {
            alert("No projects available.");
            return;
        }
        showProjectPicker(task.id);
    });

    return assignIcon;
}

function showProjectPicker(taskId) {
    const existingOverlay = document.getElementById("projectPickerOverlay");
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "projectPickerOverlay";
    overlay.className = "project-picker-overlay";

    const panel = document.createElement("div");
    panel.className = "project-picker";

    const title = document.createElement("div");
    title.className = "project-picker-title";
    title.textContent = "Assign to project";

    const list = document.createElement("div");
    list.className = "project-picker-list";

    projectsCache.forEach(project => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "project-picker-item";
        item.textContent = project.name;
        item.addEventListener("click", () => {
            fetch(`/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: project.id })
            }).then(() => location.reload());
        });
        list.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.className = "project-picker-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "project-picker-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());

    actions.appendChild(cancelBtn);

    panel.appendChild(title);
    panel.appendChild(list);
    panel.appendChild(actions);
    overlay.appendChild(panel);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
    const firstItem = panel.querySelector(".project-picker-item");
    if (firstItem) {
        firstItem.focus();
    }
}

function renderTask(task, container, projectMap){
    const li = document.createElement("li");
    li.className = "task-item";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.marginBottom = "8px";
    
    const checkbox = createCheckbox(task)

    const label = document.createElement("span");
    const projectName = projectMap && task.project_id ? projectMap[task.project_id] : null;
    const projectLabel = projectName ? ` (${projectName})` : (task.project_id ? ` (Project #${task.project_id})` : "");
    label.textContent = ` ${task.name}${projectLabel}`;
    label.style.marginLeft = "8px";

    const editIcon = createEditIcon(task)
    const assignIcon = task.status === "complete" ? null : createAssignIcon(task)
    const trashIcon = createTrashIcon(task)

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(editIcon);
    if (assignIcon) {
        li.appendChild(assignIcon);
    }
    li.appendChild(trashIcon);
    container.appendChild(li);
}

// Main Functions
    Promise.all([fetch("/tasks"), fetch("/projects")])
    .then(([tasksResponse, projectsResponse]) => Promise.all([tasksResponse.json(), projectsResponse.json()]))
    .then(([tasksData, projectsData]) => {
        const taskList = document.getElementById("taskList");
        const completedList = document.getElementById("completedList");
        const projectMap = {};
        projectsCache = projectsData.projects || [];
        projectsCache.forEach(project => {
            projectMap[project.id] = project.name;
        });

        // Sort completed tasks by most recent
        const sortedCompleted = tasksData.tasks
            .filter(task => task.status === "complete")
            .sort((a, b) => new Date(b.date_completed || 0) - new Date(a.date_completed || 0));

        const todoTasks = tasksData.tasks.filter(task => task.status !== "complete");
   
        // Render to-do tasks
        todoTasks.forEach(task => renderTask(task, taskList, projectMap));

        // Render completed tasks (sorted)
        sortedCompleted.forEach(task => renderTask(task, completedList, projectMap));
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
    fetch("/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: task.trim() })
    }).then(() => location.reload());
}
});

document.getElementById("addProjectBtn").addEventListener("click", function () {
    const project = prompt("What project would you like to add?");
    if (project && project.trim() !== "") {
        fetch("/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: project.trim() })
        }).then(() => location.reload());
    }
    });

document.getElementById("addNodeBtn").addEventListener("click", function () {
    const node = prompt("Node title?");
    if (node && node.trim() !== "") {
        fetch("/nodes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: node.trim() })
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
if (menuButtons.length > 0) {
    menuButtons[0].classList.add("active");
}

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

        if (title === "Projects") {
            loadProjects();  // ⬅ Load when tab clicked
        }
        if (title === "Knowledge Base") {
            loadNodes();  // ⬅ Load when Knowledge tab clicked
        }
    });
});

function renderProject(project) {
    const li = document.createElement("li");
    li.className = "project-item";

    const link = document.createElement("a");
    link.textContent = project.name;
    link.href = `/project/${project.id}`;  // 🔗 Link to the project page
    link.style.textDecoration = "none";

    li.appendChild(link);
    document.getElementById("projectList").appendChild(li);
}

function loadProjects() {
    fetch("/projects")
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("projectList");
            list.innerHTML = "";
            data.projects.forEach(renderProject);
        });
}

function renderNode(node) {
    const li = document.createElement("li");
    li.className = "node-item";

    const link = document.createElement("a");
    link.textContent = node.name;
    link.href = "#";
    link.style.textDecoration = "none";
    link.addEventListener("click", (event) => {
        event.preventDefault();
        loadNodeContent(node.id);
    });

    li.appendChild(link);
    document.getElementById("knowledgeList").appendChild(li);
}

let activeNodeId = null;
let activeNodeContent = "";
let saveTimer = null;

function loadNodeContent(nodeId) {
    fetch(`/nodes/${nodeId}`)
        .then(response => response.json())
        .then(node => {
            const title = document.getElementById("knowledgeTitle");
            const body = document.getElementById("knowledgeBody");
            const listView = document.getElementById("knowledgeListView");
            const contentView = document.getElementById("knowledgeContentView");
            title.textContent = node.name || "Untitled";
            body.textContent = node.content || "";
            listView.style.display = "none";
            contentView.style.display = "block";
            setKnowledgeEditMode(true);
            activeNodeId = node.id;
            activeNodeContent = node.content || "";
        });
}

function loadNodes() {
    fetch("/nodes")
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("knowledgeList");
            list.innerHTML = "";
            data.nodes.forEach(renderNode);
            document.getElementById("knowledgeTitle").textContent = "";
            document.getElementById("knowledgeBody").textContent = "";
            document.getElementById("knowledgeListView").style.display = "block";
            document.getElementById("knowledgeContentView").style.display = "none";
        });
}

const knowledgeBackBtn = document.getElementById("knowledgeBackBtn");
if (knowledgeBackBtn) {
    knowledgeBackBtn.addEventListener("click", () => {
        document.getElementById("knowledgeListView").style.display = "block";
        document.getElementById("knowledgeContentView").style.display = "none";
    });
}

function setKnowledgeEditMode(isEditing) {
    const body = document.getElementById("knowledgeBody");
    if (isEditing) {
        body.contentEditable = "true";
        body.classList.add("is-editing");
    } else {
        body.contentEditable = "false";
        body.classList.remove("is-editing");
    }
}

const knowledgeBody = document.getElementById("knowledgeBody");
if (knowledgeBody) {
    knowledgeBody.addEventListener("input", () => {
        if (!activeNodeId) {
            return;
        }
        const rawContent = knowledgeBody.textContent;
        if (rawContent === activeNodeContent) {
            return;
        }
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            fetch(`/nodes/${activeNodeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: rawContent })
            }).then(() => {
                activeNodeContent = rawContent;
            });
        }, 600);
    });
}

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderMarkdown(markdown) {
    if (!markdown) {
        return "";
    }

    let html = escapeHtml(markdown);

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);

    // Headings
    html = html.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
    html = html.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
    html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

    // Bold and italics
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Lists
    html = html.replace(/^(?:-|\*) (.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    // Line breaks
    html = html.replace(/\n{2,}/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<p>${html}</p>`;

    return html;
}
