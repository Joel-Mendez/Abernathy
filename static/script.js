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
        }).then(() => refreshCurrentView());
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
            }).then(() => refreshCurrentView());
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
                .then(() => refreshCurrentView());
        }
    });

    return trashIcon;
}

function createDueDateIcon(task) {
    const dateIcon = document.createElement("i");
    dateIcon.className = "fas fa-calendar";
    dateIcon.title = "Set due date";

    dateIcon.addEventListener("click", () => {
        showDueDatePicker(task);
    });

    return dateIcon;
}

function createProjectEditIcon(project) {
    const editIcon = document.createElement("i");
    editIcon.className = "fas fa-pencil-alt";
    editIcon.title = "Edit";
    editIcon.addEventListener("click", () => {
        const newName = prompt("Edit project name:", project.name);
        if (newName && newName.trim() !== "") {
            fetch(`/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() })
            }).then(() => loadProjects());
        }
    });
    return editIcon;
}

function createProjectTrashIcon(project) {
    const trashIcon = document.createElement("i");
    trashIcon.className = "fas fa-trash";
    trashIcon.title = "Delete";
    trashIcon.addEventListener("click", () => {
        if (confirm(`Delete "${project.name}"?`)) {
            fetch(`/projects/${project.id}`, { method: "DELETE" })
                .then(() => loadProjects());
        }
    });
    return trashIcon;
}

function createNodeEditIcon(node) {
    const editIcon = document.createElement("i");
    editIcon.className = "fas fa-pencil-alt";
    editIcon.title = "Edit";
    editIcon.addEventListener("click", () => {
        const newName = prompt("Edit node name:", node.name);
        if (newName && newName.trim() !== "") {
            fetch(`/nodes/${node.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() })
            }).then(() => loadNodes());
        }
    });
    return editIcon;
}

function createNodeTrashIcon(node) {
    const trashIcon = document.createElement("i");
    trashIcon.className = "fas fa-trash";
    trashIcon.title = "Delete";
    trashIcon.addEventListener("click", () => {
        if (confirm(`Delete "${node.name}"?`)) {
            fetch(`/nodes/${node.id}`, { method: "DELETE" })
                .then(() => loadNodes());
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
            }).then(() => refreshCurrentView());
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
    label.style.marginLeft = "8px";
    label.textContent = ` ${task.name}`;

    const projectName = projectMap && task.project_id ? projectMap[task.project_id] : null;
    if (task.project_id) {
        const projectLink = document.createElement("a");
        projectLink.href = "#";
        projectLink.textContent = projectName ? ` (${projectName})` : ` (Project #${task.project_id})`;
        projectLink.style.marginLeft = "4px";
        projectLink.style.textDecoration = "none";
        projectLink.addEventListener("click", (event) => {
            event.preventDefault();
            showPage("Projects");
            loadProjectContent(task.project_id);
        });
        label.appendChild(projectLink);
    }

    const editIcon = createEditIcon(task)
    const assignIcon = task.status === "complete" ? null : createAssignIcon(task)
    const dueDateIcon = task.status === "complete" ? null : createDueDateIcon(task)
    const trashIcon = createTrashIcon(task)

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(editIcon);
    if (assignIcon) {
        li.appendChild(assignIcon);
    }
    if (dueDateIcon) {
        li.appendChild(dueDateIcon);
    }
    li.appendChild(trashIcon);
    container.appendChild(li);
}

// Main Functions
function loadTasksView() {
    return Promise.all([fetch("/tasks"), fetch("/projects")])
        .then(([tasksResponse, projectsResponse]) => Promise.all([tasksResponse.json(), projectsResponse.json()]))
        .then(([tasksData, projectsData]) => {
            const priorityList = document.getElementById("priorityList");
            const taskProjectList = document.getElementById("taskProjectList");
            const dueDateList = document.getElementById("dueDateList");
            const projectMap = {};
            projectsCache = projectsData.projects || [];
            projectsCache.forEach(project => {
                projectMap[project.id] = project.name;
            });

            const openTasks = (tasksData.tasks || []).filter(task => task.status !== "complete");

            const byDueDate = [...openTasks].sort((a, b) => {
                const aDate = a.due_date ? new Date(a.due_date) : null;
                const bDate = b.due_date ? new Date(b.due_date) : null;
                if (aDate && bDate) {
                    return aDate - bDate;
                }
                if (aDate) return -1;
                if (bDate) return 1;
                return a.name.localeCompare(b.name);
            });

            // Priority tab (due date order for now)
            priorityList.innerHTML = "";
            byDueDate.forEach(task => renderTask(task, priorityList, projectMap));

            // Due Date tab (grouped by due date)
            dueDateList.innerHTML = "";
            const dueGroups = {};
            byDueDate.forEach(task => {
                const key = task.due_date ? formatDateHeading(new Date(task.due_date)) : "No due date";
                if (!dueGroups[key]) {
                    dueGroups[key] = [];
                }
                dueGroups[key].push(task);
            });

            Object.keys(dueGroups).forEach(dateKey => {
                const heading = document.createElement("li");
                heading.textContent = dateKey;
                heading.style.fontWeight = "700";
                heading.style.marginTop = "10px";
                dueDateList.appendChild(heading);
                dueGroups[dateKey].forEach(task => renderTask(task, dueDateList, projectMap));
            });

            // Project tab (grouped by project name, alphabetical)
            taskProjectList.innerHTML = "";
            const grouped = {};
            openTasks.forEach(task => {
                const name = task.project_id ? (projectMap[task.project_id] || `Project #${task.project_id}`) : "Unassigned";
                if (!grouped[name]) {
                    grouped[name] = [];
                }
                grouped[name].push(task);
            });

            Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach(projectName => {
                const heading = document.createElement("li");
                heading.textContent = projectName;
                heading.style.fontWeight = "700";
                heading.style.marginTop = "10px";
                taskProjectList.appendChild(heading);
                grouped[projectName].forEach(task => renderTask(task, taskProjectList, projectMap));
            });
        });
}

loadTasksView();

window.onload = () => {
    const savedTab = localStorage.getItem("activeTaskTab");
    if (savedTab === "project") {
        document.getElementById("projectBtn").click();
    } else if (savedTab === "dueDate") {
        document.getElementById("dueDateBtn").click();
    } else {
        document.getElementById("priorityBtn").click();
    }
};


// UI Actions
function showTaskTab(tab) {
    document.getElementById("priorityList").style.display = tab === "priority" ? "block" : "none";
    document.getElementById("taskProjectList").style.display = tab === "project" ? "block" : "none";
    document.getElementById("dueDateList").style.display = tab === "dueDate" ? "block" : "none";
    document.getElementById("priorityBtn").classList.toggle("active", tab === "priority");
    document.getElementById("projectBtn").classList.toggle("active", tab === "project");
    document.getElementById("dueDateBtn").classList.toggle("active", tab === "dueDate");
    localStorage.setItem("activeTaskTab", tab);
    document.getElementById("addTaskBtn").style.display = "block";
}

document.getElementById("priorityBtn").addEventListener("click", () => {
    showTaskTab("priority");
});

document.getElementById("projectBtn").addEventListener("click", () => {
    showTaskTab("project");
});

document.getElementById("dueDateBtn").addEventListener("click", () => {
    showTaskTab("dueDate");
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
    }).then(() => refreshCurrentView());
}
});

document.getElementById("addProjectBtn").addEventListener("click", function () {
    const isProjectDetail = document.getElementById("projectContentView").style.display === "block";
    if (isProjectDetail && activeProjectId) {
        const task = prompt("What task would you like to add?");
        if (task && task.trim() !== "") {
            fetch("/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: task.trim(), project_id: activeProjectId })
            }).then(() => loadProjectContent(activeProjectId));
        }
        return;
    }

    const project = prompt("What project would you like to add?");
    if (project && project.trim() !== "") {
        fetch("/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: project.trim() })
        }).then(() => loadProjects());
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
        }).then(() => refreshCurrentView());
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

function showPage(title) {
    Object.values(pages).forEach(page => page.style.display = "none");
    pages[title].style.display = "block";
    menuButtons.forEach(btn => btn.classList.remove("active"));
    menuButtons.forEach(btn => {
        if (btn.getAttribute("title") === title) {
            btn.classList.add("active");
        }
    });
    if (title === "Projects") {
        loadProjects();
    }
    if (title === "Tasks") {
        loadTasksView();
    }
    if (title === "Knowledge Base") {
        loadNodes();
    }
    if (title === "Progress") {
        loadProgressLog();
    }
    if (title === "Calendar") {
        loadCalendarLog();
    }
}

showPage("Tasks");

// Add click listeners to menu buttons
menuButtons.forEach(button => {
    button.addEventListener("click", () => {
        const title = button.getAttribute("title");

        showPage(title);
    });
});

function renderProject(project) {
    const li = document.createElement("li");
    li.className = "project-item";

    const link = document.createElement("a");
    link.textContent = project.name;
    link.href = "#";
    link.style.textDecoration = "none";
    link.addEventListener("click", (event) => {
        event.preventDefault();
        loadProjectContent(project.id);
    });

    const editIcon = createProjectEditIcon(project);
    const trashIcon = createProjectTrashIcon(project);

    li.appendChild(link);
    li.appendChild(editIcon);
    li.appendChild(trashIcon);
    document.getElementById("projectList").appendChild(li);
}

function loadProjectContent(projectId) {
    fetch(`/projects/${projectId}`)
        .then(response => response.json())
        .then(data => {
            const listView = document.getElementById("projectListView");
            const contentView = document.getElementById("projectContentView");
            const title = document.getElementById("projectTitle");
            const taskList = document.getElementById("projectTaskList");
            title.textContent = data.project?.name || "Project";
            taskList.innerHTML = "";
            const tasks = (data.tasks || []).filter(task => task.status !== "complete");
            const projectMap = {};
            (projectsCache || []).forEach(project => {
                projectMap[project.id] = project.name;
            });
            if (tasks.length === 0) {
                const empty = document.createElement("li");
                empty.textContent = "No open tasks assigned yet.";
                taskList.appendChild(empty);
            } else {
                tasks.forEach(task => renderTask(task, taskList, projectMap));
            }
            listView.style.display = "none";
            contentView.style.display = "block";
            activeProjectId = data.project?.id || projectId;
        });
}

function loadProjects() {
    fetch("/projects")
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("projectList");
            list.innerHTML = "";
            data.projects.forEach(renderProject);
            document.getElementById("projectListView").style.display = "block";
            document.getElementById("projectContentView").style.display = "none";
        });
}

function refreshCurrentView() {
    const tasksPage = document.getElementById("tasksPage");
    const projectsPage = document.getElementById("projectsPage");
    const knowledgePage = document.getElementById("knowledgePage");
    const progressPage = document.getElementById("progressPage");
    const calendarPage = document.getElementById("calendarPage");

    const isVisible = (el) => el && getComputedStyle(el).display !== "none";

    if (isVisible(tasksPage)) {
        loadTasksView();
        return;
    }

    if (isVisible(projectsPage)) {
        const contentView = document.getElementById("projectContentView");
        if (isVisible(contentView) && activeProjectId) {
            loadProjectContent(activeProjectId);
        } else {
            loadProjects();
        }
        return;
    }

    if (isVisible(knowledgePage)) {
        const contentView = document.getElementById("knowledgeContentView");
        if (isVisible(contentView) && activeNodeId) {
            loadNodeContent(activeNodeId);
        } else {
            loadNodes();
        }
        return;
    }

    if (isVisible(progressPage)) {
        loadProgressLog();
        return;
    }

    if (isVisible(calendarPage)) {
        loadCalendarLog();
    }
}

function loadProgressLog() {
    fetch("/tasks")
        .then(response => response.json())
        .then(data => {
            const log = document.getElementById("progressLog");
            log.innerHTML = "";
            const completed = (data.tasks || [])
                .filter(task => task.status === "complete" && task.date_completed)
                .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed));

            if (completed.length === 0) {
                const empty = document.createElement("li");
                empty.textContent = "No completed tasks yet.";
                log.appendChild(empty);
                return;
            }

            const groups = {};
            completed.forEach(task => {
                const dateKey = formatDateHeading(new Date(task.date_completed));
                if (!groups[dateKey]) {
                    groups[dateKey] = [];
                }
                groups[dateKey].push(task);
            });

            Object.keys(groups).forEach(dateKey => {
                const heading = document.createElement("li");
                heading.textContent = dateKey;
                heading.style.fontWeight = "700";
                heading.style.marginTop = "10px";
                log.appendChild(heading);

                groups[dateKey].forEach(task => {
                    const time = new Date(task.date_completed).toLocaleTimeString();
                    const item = document.createElement("li");
                    item.textContent = `(${time}) ${task.name}`;
                    log.appendChild(item);
                });
            });
        });
}

function loadCalendarLog() {
    fetch("/tasks")
        .then(response => response.json())
        .then(data => {
            const log = document.getElementById("calendarLog");
            log.innerHTML = "";
            const openTasks = (data.tasks || []).filter(task => task.status !== "complete");
            const projectMap = {};
            (projectsCache || []).forEach(project => {
                projectMap[project.id] = project.name;
            });

            if (openTasks.length === 0) {
                const empty = document.createElement("li");
                empty.textContent = "No open tasks yet.";
                log.appendChild(empty);
                return;
            }

            const byDueDate = [...openTasks].sort((a, b) => {
                const aDate = a.due_date ? new Date(a.due_date) : null;
                const bDate = b.due_date ? new Date(b.due_date) : null;
                if (aDate && bDate) {
                    return aDate - bDate;
                }
                if (aDate) return -1;
                if (bDate) return 1;
                return a.name.localeCompare(b.name);
            });

            const groups = {};
            byDueDate.forEach(task => {
                const dateKey = task.due_date ? formatDateHeading(new Date(task.due_date)) : "No due date";
                if (!groups[dateKey]) {
                    groups[dateKey] = [];
                }
                groups[dateKey].push(task);
            });

            Object.keys(groups).forEach(dateKey => {
                const heading = document.createElement("li");
                heading.textContent = dateKey;
                heading.style.fontWeight = "700";
                heading.style.marginTop = "10px";
                log.appendChild(heading);

                groups[dateKey].forEach(task => renderTask(task, log, projectMap));
            });
        });
}

function showDueDatePicker(task) {
    const existingOverlay = document.getElementById("dueDatePickerOverlay");
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "dueDatePickerOverlay";
    overlay.className = "due-date-picker-overlay";

    const panel = document.createElement("div");
    panel.className = "due-date-picker";

    const title = document.createElement("div");
    title.className = "due-date-picker-title";
    title.textContent = "Set due date";

    const input = document.createElement("input");
    input.type = "date";
    input.className = "due-date-picker-input";
    if (task.due_date) {
        input.value = task.due_date;
    }

    const actions = document.createElement("div");
    actions.className = "due-date-picker-actions";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "due-date-picker-clear";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => {
        fetch(`/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ due_date: null })
        }).then(() => refreshCurrentView());
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "due-date-picker-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "due-date-picker-save";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
        if (!input.value) {
            return;
        }
        fetch(`/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ due_date: input.value })
        }).then(() => refreshCurrentView());
    });

    actions.appendChild(clearBtn);
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    panel.appendChild(title);
    panel.appendChild(input);
    panel.appendChild(actions);
    overlay.appendChild(panel);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
    input.focus();
}
function formatDateHeading(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    }).formatToParts(date);

    const lookup = {};
    parts.forEach(part => {
        if (part.type !== "literal") {
            lookup[part.type] = part.value;
        }
    });

    const weekday = lookup.weekday ? `${lookup.weekday}.` : "";
    const month = lookup.month ? `${lookup.month}.` : "";
    return `${weekday} ${month} ${lookup.day}, ${lookup.year}`.replace(/\s+/g, " ").trim();
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

    const editIcon = createNodeEditIcon(node);
    const trashIcon = createNodeTrashIcon(node);

    li.appendChild(link);
    li.appendChild(editIcon);
    li.appendChild(trashIcon);
    document.getElementById("knowledgeList").appendChild(li);
}

let activeNodeId = null;
let activeNodeContent = "";
let saveTimer = null;
let activeProjectId = null;

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

const projectBackBtn = document.getElementById("projectBackBtn");
if (projectBackBtn) {
    projectBackBtn.addEventListener("click", () => {
        document.getElementById("projectListView").style.display = "block";
        document.getElementById("projectContentView").style.display = "none";
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
