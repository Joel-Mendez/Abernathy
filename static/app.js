let currentTab = 'tasks'  // tracks which tab is active

function loadTasks(){
    fetch("/tasks")
    .then(response => response.json())
    .then(allTasks => {
        if (currentTab === 'projects') {
            document.getElementById("add-btn").style.display = ""
            document.getElementById("add-task").style.display = "none"
            fetch("/projects")
            .then(r => r.json())
            .then(projects => {
                const list = document.getElementById("task-list")
                list.innerHTML = ""
                projects.forEach(project => {
                    const item = document.createElement("li")

                    const nameSpan = document.createElement("span")
                    nameSpan.textContent = project.name + " "
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
            })
            return
        }

        // Filter tasks based on active tab; Progress tab sorted newest completion first
        const tasks = currentTab === 'tasks'
            ? allTasks.filter(t => t.status !== 'Completed')
            : allTasks
                .filter(t => t.status === 'Completed')
                .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))

        // Only show the + button on the Tasks tab; always close the form on tab switch
        document.getElementById("add-btn").style.display = currentTab === 'tasks' ? "" : "none"
        document.getElementById("add-task").style.display = "none"

        const list = document.getElementById("task-list")
        list.innerHTML = ""  // clear the list before re-rendering
        let currentDate = null
        tasks.forEach(task => {
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

                const prioritySelect = document.createElement("select")
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
                })
                item.appendChild(prioritySelect)

                const dueDateInput = document.createElement("input")
                dueDateInput.type = "date"
                dueDateInput.value = task.due_date || ""  // pre-fill if set, else empty
                dueDateInput.addEventListener("change", () => {
                    fetch("/update-due-date", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({id: task.id, due_date: dueDateInput.value || null})
                    })
                    .then(response => response.json())
                })
                item.appendChild(dueDateInput)
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
                const depSection = document.createElement("div")

                // Children label (read-only): auto-populated from child_ids
                const childrenLabel = document.createElement("span")
                if (task.child_ids.length > 0) {
                    const childNames = task.child_ids.map(cid => {
                        const found = allTasks.find(t => t.id === cid)
                        return found ? found.name : '(unknown)'
                    })
                    childrenLabel.textContent = 'Children: ' + childNames.join(', ') + ' '
                } else {
                    childrenLabel.style.display = 'none'
                }
                depSection.appendChild(childrenLabel)

                // Parents row: one removable tag per parent + add-parent dropdown
                const parentsRow = document.createElement("div")

                task.parent_ids.forEach(pid => {
                    const parentTask = allTasks.find(t => t.id === pid)
                    if (!parentTask) return
                    const tag = document.createElement('span')
                    tag.textContent = parentTask.name + ' '
                    const removeBtn = document.createElement('button')
                    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>'
                    removeBtn.addEventListener('click', () => {
                        fetch('/remove-dependency', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({parent_id: pid, child_id: task.id})
                        })
                        .then(r => r.json())
                        .then(() => loadTasks())
                    })
                    tag.appendChild(removeBtn)
                    parentsRow.appendChild(tag)
                })

                // Add-parent dropdown: excludes self, existing parents, direct children
                const addParentSelect = document.createElement('select')
                const placeholder = document.createElement('option')
                placeholder.value = ''
                placeholder.textContent = '+ Add parent'
                placeholder.disabled = true
                placeholder.selected = true
                addParentSelect.appendChild(placeholder)

                allTasks.forEach(other => {
                    if (other.id === task.id) return                // no self-parenting
                    if (task.parent_ids.includes(other.id)) return  // already a parent
                    if (task.child_ids.includes(other.id)) return   // direct cycle guard
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
                parentsRow.appendChild(addParentSelect)

                depSection.appendChild(parentsRow)
                item.appendChild(depSection)
            }
            // --- End dependency section ---

            list.appendChild(item)
        })
    })
}

function switchTab(tab) {
    currentTab = tab
    document.getElementById("tab-tasks").classList.toggle("active", tab === 'tasks')
    document.getElementById("tab-projects").classList.toggle("active", tab === 'projects')
    document.getElementById("tab-progress").classList.toggle("active", tab === 'progress')
    const titles = { tasks: "Tasks", projects: "Projects", progress: "Progress" }
    document.getElementById("tab-title").textContent = titles[tab]
    loadTasks()
}

function toggleAddForm() {
    const form = document.getElementById("add-task")
    const input = document.getElementById("input")
    const isOpen = form.style.display === "flex"
    form.style.display = isOpen ? "none" : "flex"
    if (!isOpen) {
        input.placeholder = currentTab === 'projects' ? "Project name ..." : "Task name ..."
        input.focus()
    }
}

function sendInput(){
    const user_input = document.getElementById("input").value
    if (!user_input.trim()) return
    const url = currentTab === 'projects' ? "/create-project" : "/create-task"
    const body = currentTab === 'projects'
        ? JSON.stringify({name: user_input})
        : JSON.stringify({message: user_input})
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
