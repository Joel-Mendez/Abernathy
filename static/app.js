let currentTab = 'tasks'      // tracks which tab is active
let currentProject = null     // set when viewing a project's tasks
let currentTaskView = null    // 'priority' | 'project' | 'duedate' | null (flat)

function loadTasks(){
    const showToggle = currentTab === 'tasks' || currentProject !== null
    document.getElementById("view-toggle").style.display = showToggle ? "" : "none"
    document.getElementById("view-project").style.display = currentProject !== null ? "none" : ""
    Promise.all([
        fetch("/tasks").then(r => r.json()),
        fetch("/projects").then(r => r.json())
    ])
    .then(([allTasks, allProjects]) => {
        if (currentTab === 'projects' && currentProject === null) {
            document.getElementById("add-btn").style.display = ""
            document.getElementById("add-task").style.display = "none"
            document.getElementById("back-btn").style.display = "none"
            document.getElementById("tab-title").textContent = "Projects"
            const list = document.getElementById("task-list")
            list.innerHTML = ""
            allProjects.forEach(project => {
                const item = document.createElement("li")

                    const nameSpan = document.createElement("span")
                    nameSpan.textContent = project.name + " "
                    nameSpan.style.cursor = "pointer"
                    nameSpan.style.textDecoration = "underline"
                    nameSpan.addEventListener("click", () => {
                        currentProject = project
                        loadTasks()
                    })
                    item.appendChild(nameSpan)

                    const editBtn = document.createElement("button")
                    editBtn.dataset.mode = "edit"
                    editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>'
                    editBtn.addEventListener("click", () => {
                        if (editBtn.dataset.mode === "edit") {
                            const input = document.createElement("input")
                            input.type = "text"
                            input.value = nameSpan.textContent.trim()
                            item.replaceChild(input, nameSpan)
                            editBtn.dataset.mode = "save"
                            editBtn.innerHTML = '<i class="fa-solid fa-check"></i>'
                        } else {
                            const input = item.querySelector("input[type='text']")
                            fetch("/update-project", {
                                method: "POST",
                                headers: {"Content-Type": "application/json"},
                                body: JSON.stringify({id: project.id, name: input.value})
                            })
                            .then(r => r.json())
                            .then(() => loadTasks())
                        }
                    })
                    item.appendChild(editBtn)

                    const deleteBtn = document.createElement("button")
                    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'
                    deleteBtn.addEventListener("click", () => {
                        fetch("/delete-project", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({id: project.id})
                        })
                        .then(r => r.json())
                        .then(() => loadTasks())
                    })
                    item.appendChild(deleteBtn)

                    list.appendChild(item)
            })
            return
        }

        // Project detail view: show non-completed tasks for the selected project
        if (currentProject !== null) {
            document.getElementById("add-btn").style.display = ""
            document.getElementById("add-task").style.display = "none"
            document.getElementById("back-btn").style.display = ""
            document.getElementById("tab-title").textContent = currentProject.name
        } else {
            document.getElementById("back-btn").style.display = "none"
        }

        // Filter tasks based on active tab; Progress tab sorted newest completion first
        const tasks = currentProject !== null
            ? allTasks.filter(t => t.status !== 'Completed' && t.project_id === currentProject.id)
            : currentTab === 'tasks'
                ? allTasks.filter(t => t.status !== 'Completed')
                : allTasks
                    .filter(t => t.status === 'Completed')
                    .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))

        // Only show the + button on the Tasks tab; always close the form on tab switch
        if (currentProject === null) {
            document.getElementById("add-btn").style.display = currentTab === 'tasks' ? "" : "none"
            document.getElementById("add-task").style.display = "none"
        }

        const list = document.getElementById("task-list")
        list.innerHTML = ""  // clear the list before re-rendering

        // Group tasks for the active view mode
        let taskGroups = [{ header: null, items: tasks }]
        if (currentTaskView) {
            const buckets = new Map()
            tasks.forEach(t => {
                let key, label
                if (currentTaskView === 'priority') {
                    key = t.priority || 0
                    const pl = { 0: 'No Priority', 1: '1 — Minimal', 2: '2 — Routine', 3: '3 — Important', 4: '4 — Urgent', 5: '5 — Critical' }
                    label = pl[key]
                } else if (currentTaskView === 'project') {
                    const proj = allProjects.find(p => p.id === t.project_id)
                    key = proj ? proj.id : 0
                    label = proj ? proj.name : 'No Project'
                } else {
                    key = t.due_date || 'No Due Date'
                    if (key === 'No Due Date') {
                        label = 'No Due Date'
                    } else {
                        const [y, mo, dy] = key.split('-').map(Number)
                        const dt = new Date(y, mo - 1, dy)
                        const wd = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
                        const mn = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
                        label = `${wd[dt.getDay()]} ${mn[dt.getMonth()]} ${dt.getDate()}, ${y}`
                    }
                }
                if (!buckets.has(key)) buckets.set(key, { header: label, items: [] })
                buckets.get(key).items.push(t)
            })
            let entries = [...buckets.entries()]
            if (currentTaskView === 'priority') {
                entries.sort(([a], [b]) => { if (a === 0) return 1; if (b === 0) return -1; return b - a })
            } else if (currentTaskView === 'project') {
                entries.sort(([, av], [, bv]) => { if (av.header === 'No Project') return 1; if (bv.header === 'No Project') return -1; return av.header.localeCompare(bv.header) })
            } else {
                entries.sort(([a], [b]) => { if (a === 'No Due Date') return 1; if (b === 'No Due Date') return -1; return a.localeCompare(b) })
            }
            taskGroups = entries.map(([, g]) => g)
        }

        // Flatten into a render sequence, inserting group header sentinels
        const renderItems = []
        taskGroups.forEach(({ header, items }) => {
            if (header !== null) renderItems.push({ task: null, groupHeader: header })
            items.forEach(task => renderItems.push({ task, groupHeader: null }))
        })

        let currentDate = null
        renderItems.forEach(({ task, groupHeader }) => {
            if (groupHeader !== null) {
                const h = document.createElement('h3')
                h.textContent = groupHeader
                list.appendChild(h)
                return
            }
            // Insert a date header whenever the date changes (Progress tab only)
            if (currentTab === 'progress') {
                const taskDate = task.date_completed ? task.date_completed.split(' ')[0] : 'No Date'
                if (taskDate !== currentDate) {
                    currentDate = taskDate
                    const header = document.createElement('h3')
                    if (taskDate === 'No Date') {
                        header.textContent = 'No Date'
                    } else {
                        const weekdays = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
                        const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
                        const [year, month, day] = taskDate.split('-').map(Number)
                        const d = new Date(year, month - 1, day)
                        header.textContent = `${weekdays[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}, ${year}`
                    }
                    list.appendChild(header)
                }
            }

            const item = document.createElement("li")

            if (currentTab === 'progress') {
                // Show completion time in 12-hour format with seconds
                if (task.date_completed) {
                    const timeSpan = document.createElement("span")
                    const timePart = task.date_completed.split(' ')[1]  // "14:22:00"
                    const [h, m, s] = timePart.split(':').map(Number)
                    const ampm = h >= 12 ? 'PM' : 'AM'
                    const hour12 = h % 12 || 12
                    timeSpan.textContent = `(${hour12}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${ampm}) `
                    item.appendChild(timeSpan)
                }
            } else {
                // Checkbox: checked when status is Completed, unchecked otherwise
                const checkbox = document.createElement("input")
                checkbox.type = "checkbox"
                checkbox.checked = task.status === "Completed"
                checkbox.addEventListener("change", () => {
                    const newStatus = checkbox.checked ? "Completed" : "To-Do"
                    fetch("/update-status", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({id: task.id, status: newStatus})
                    })
                    .then(response => response.json())
                    .then(() => loadTasks())  // refresh so task moves to correct tab
                })
                item.appendChild(checkbox)
            }

            // Use a span for the name so it can be swapped with an input on edit
            const nameSpan = document.createElement("span")
            nameSpan.textContent = currentTab === 'progress' ? task.name : task.name + " "
            item.appendChild(nameSpan)

            if (task.project_id) {
                const project = allProjects.find(p => p.id === task.project_id)
                if (project) {
                    const projectLabel = document.createElement("span")
                    projectLabel.textContent = `(${project.name}) `
                    projectLabel.style.color = "#4a90d9"
                    projectLabel.style.cursor = "pointer"
                    projectLabel.addEventListener("click", () => {
                        currentTab = 'projects'
                        currentProject = project
                        document.getElementById("tab-tasks").classList.remove("active")
                        document.getElementById("tab-projects").classList.add("active")
                        loadTasks()
                    })
                    item.appendChild(projectLabel)
                }
            }

            if (currentTab === 'tasks') {
                const select = document.createElement("select")
                const statuses = ["To-Do", "In Progress", "Completed", "Cancelled", "Backlog", "Blocked", "Waiting"]
                statuses.forEach(s => {
                    const opt = document.createElement("option")
                    opt.value = s
                    opt.textContent = s
                    if (s === task.status) opt.selected = true
                    select.appendChild(opt)
                })
                select.addEventListener("change", () => {
                    checkbox.checked = select.value === "Completed"  // keep checkbox in sync
                    fetch("/update-status", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({id: task.id, status: select.value})
                    })
                    .then(response => response.json())
                    .then(() => loadTasks())  // refresh so task moves to correct tab
                })
                item.appendChild(select)

                const priorityBtn = document.createElement("button")
                priorityBtn.innerHTML = '<i class="fa-solid fa-exclamation"></i>'
                priorityBtn.title = task.priority ? `Priority ${task.priority}` : "Set priority"
                priorityBtn.addEventListener("click", () => {
                    const existing = item.querySelector(".priority-select")
                    if (existing) { existing.remove(); return }
                    const prioritySelect = document.createElement("select")
                    prioritySelect.className = "priority-select"
                    const priorities = [
                        [1, "1 — Minimal"],
                        [2, "2 — Routine"],
                        [3, "3 — Important"],
                        [4, "4 — Urgent"],
                        [5, "5 — Critical"]
                    ]
                    priorities.forEach(([val, label]) => {
                        const opt = document.createElement("option")
                        opt.value = val
                        opt.textContent = label
                        if (val === task.priority) opt.selected = true
                        prioritySelect.appendChild(opt)
                    })
                    prioritySelect.addEventListener("change", () => {
                        fetch("/update-priority", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({id: task.id, priority: parseInt(prioritySelect.value)})
                        })
                        .then(response => response.json())
                        .then(() => loadTasks())
                    })
                    item.appendChild(prioritySelect)
                })
                item.appendChild(priorityBtn)

                const calendarBtn = document.createElement("button")
                calendarBtn.innerHTML = '<i class="fa-solid fa-calendar"></i>'
                calendarBtn.title = task.due_date || "Set due date"
                calendarBtn.addEventListener("click", () => {
                    const existing = item.querySelector(".due-date-input")
                    if (existing) { existing.remove(); return }
                    const dueDateInput = document.createElement("input")
                    dueDateInput.type = "date"
                    dueDateInput.className = "due-date-input"
                    dueDateInput.value = task.due_date || ""
                    dueDateInput.addEventListener("change", () => {
                        fetch("/update-due-date", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({id: task.id, due_date: dueDateInput.value || null})
                        })
                        .then(response => response.json())
                        .then(() => loadTasks())
                    })
                    item.appendChild(dueDateInput)
                })
                item.appendChild(calendarBtn)
            }

            if (currentTab === 'tasks') {
                const editBtn = document.createElement("button")
                editBtn.dataset.mode = "edit"
                editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>'
                editBtn.addEventListener("click", () => {
                    if (editBtn.dataset.mode === "edit") {
                        // Switch to edit mode: replace span with a text input
                        const input = document.createElement("input")
                        input.type = "text"
                        input.value = nameSpan.textContent.trim()
                        item.replaceChild(input, nameSpan)
                        editBtn.dataset.mode = "save"
                        editBtn.innerHTML = '<i class="fa-solid fa-check"></i>'
                    } else {
                        // Save mode: send updated name to backend
                        const input = item.querySelector("input[type='text']")  // must specify type to avoid matching the checkbox
                        fetch("/update-task", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({id: task.id, name: input.value})
                        })
                        .then(response => response.json())
                        .then(() => loadTasks())  // refresh the list after saving
                    }
                })
                item.appendChild(editBtn)

                const folderBtn = document.createElement("button")
                folderBtn.innerHTML = '<i class="fa-solid fa-folder"></i>'
                folderBtn.title = task.project_id
                    ? allProjects.find(p => p.id === task.project_id)?.name || "Assign project"
                    : "Assign project"
                folderBtn.addEventListener("click", () => {
                    const existing = item.querySelector(".project-select")
                    if (existing) { existing.remove(); return }
                    const projectSelect = document.createElement("select")
                    projectSelect.className = "project-select"
                    const none = document.createElement("option")
                    none.value = ""
                    none.textContent = "— no project —"
                    if (!task.project_id) none.selected = true
                    projectSelect.appendChild(none)
                    allProjects.forEach(p => {
                        const opt = document.createElement("option")
                        opt.value = p.id
                        opt.textContent = p.name
                        if (p.id === task.project_id) opt.selected = true
                        projectSelect.appendChild(opt)
                    })
                    projectSelect.addEventListener("change", () => {
                        fetch("/update-task-project", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({id: task.id, project_id: projectSelect.value || null})
                        })
                        .then(r => r.json())
                        .then(() => loadTasks())
                    })
                    item.appendChild(projectSelect)
                })
                item.appendChild(folderBtn)

                const deleteBtn = document.createElement("button")
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'
                deleteBtn.addEventListener("click", () => {
                    fetch("/delete-task", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({id: task.id})
                    })
                    .then(response => response.json())
                    .then(() => loadTasks())  // refresh the list after deletion
                })
                item.appendChild(deleteBtn)
            }

            // --- Dependency section (Tasks tab only) ---
            if (currentTab === 'tasks') {
                const addParentBtn = document.createElement('button')
                addParentBtn.innerHTML = '<i class="fa-solid fa-people-group"></i>'
                addParentBtn.addEventListener('click', () => {
                    const existing = item.querySelector('.parent-select')
                    if (existing) { existing.remove(); return }
                    const addParentSelect = document.createElement('select')
                    addParentSelect.className = 'parent-select'
                    const placeholder = document.createElement('option')
                    placeholder.value = ''
                    placeholder.textContent = '— select parent —'
                    placeholder.disabled = true
                    placeholder.selected = true
                    addParentSelect.appendChild(placeholder)
                    allTasks.forEach(other => {
                        if (other.id === task.id) return
                        if (task.parent_ids.includes(other.id)) return
                        if (task.child_ids.includes(other.id)) return
                        const opt = document.createElement('option')
                        opt.value = other.id
                        opt.textContent = other.name
                        addParentSelect.appendChild(opt)
                    })
                    addParentSelect.addEventListener('change', () => {
                        const selectedParentId = parseInt(addParentSelect.value)
                        fetch('/add-dependency', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({parent_id: selectedParentId, child_id: task.id})
                        })
                        .then(r => r.json())
                        .then(() => loadTasks())
                    })
                    item.appendChild(addParentSelect)
                })
                item.appendChild(addParentBtn)
            }

            list.appendChild(item)
        })
    })
}

function switchTab(tab) {
    currentTab = tab
    currentProject = null
    currentTaskView = null
    ;['view-priority', 'view-project', 'view-duedate'].forEach(id =>
        document.getElementById(id).classList.remove('active'))
    document.getElementById("tab-tasks").classList.toggle("active", tab === 'tasks')
    document.getElementById("tab-projects").classList.toggle("active", tab === 'projects')
    document.getElementById("tab-progress").classList.toggle("active", tab === 'progress')
    const titles = { tasks: "Tasks", projects: "Projects", progress: "Progress" }
    document.getElementById("tab-title").textContent = titles[tab]
    loadTasks()
}

function setTaskView(view) {
    currentTaskView = currentTaskView === view ? null : view
    document.getElementById('view-priority').classList.toggle('active', currentTaskView === 'priority')
    document.getElementById('view-project').classList.toggle('active', currentTaskView === 'project')
    document.getElementById('view-duedate').classList.toggle('active', currentTaskView === 'duedate')
    loadTasks()
}

function goBackToProjects() {
    currentProject = null
    currentTaskView = null
    ;['view-priority', 'view-project', 'view-duedate'].forEach(id =>
        document.getElementById(id).classList.remove('active'))
    loadTasks()
}

function toggleAddForm() {
    const form = document.getElementById("add-task")
    const input = document.getElementById("input")
    const isOpen = form.style.display === "flex"
    form.style.display = isOpen ? "none" : "flex"
    if (!isOpen) {
        input.placeholder = (currentTab === 'projects' && currentProject === null) ? "Project name ..." : "Task name ..."
        input.focus()
    }
}

function sendInput(){
    const user_input = document.getElementById("input").value
    if (!user_input.trim()) return
    const url = (currentTab === 'projects' && currentProject === null) ? "/create-project" : "/create-task"
    const body = (currentTab === 'projects' && currentProject === null)
        ? JSON.stringify({name: user_input})
        : JSON.stringify({message: user_input, project_id: currentProject ? currentProject.id : null})
    fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: body
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById("input").value = ""
        document.getElementById("add-task").style.display = "none"
        loadTasks()
    })
}

document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendInput()
})

loadTasks()  // load existing tasks when the page first opens
