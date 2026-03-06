let currentTab = 'tasks'  // tracks which tab is active

function loadTasks(){
    fetch("/tasks")
    .then(response => response.json())
    .then(allTasks => {
        // Filter tasks based on active tab; Progress tab sorted newest completion first
        const tasks = currentTab === 'tasks'
            ? allTasks.filter(t => t.status !== 'Completed')
            : allTasks
                .filter(t => t.status === 'Completed')
                .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))

        // Only show the add-task input on the Tasks tab
        document.getElementById("add-task").style.display = currentTab === 'tasks' ? "" : "none"

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
            // Show completion time to the left of the checkbox on Progress tab
            if (currentTab === 'progress' && task.date_completed) {
                const timeSpan = document.createElement("span")
                const timePart = task.date_completed.split(' ')[1]  // "14:22:00"
                timeSpan.textContent = timePart.slice(0, 5) + " "   // "14:22"
                item.appendChild(timeSpan)
            }

            item.appendChild(checkbox)

            // Use a span for the name so it can be swapped with an input on edit
            const nameSpan = document.createElement("span")
            nameSpan.textContent = task.name + " "
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
    // Update active styling: toggle adds the class if true, removes it if false
    document.getElementById("tab-tasks").classList.toggle("active", tab === 'tasks')
    document.getElementById("tab-progress").classList.toggle("active", tab === 'progress')
    document.getElementById("tab-title").textContent = tab === 'tasks' ? "Tasks" : "Progress"
    loadTasks()
}

function sendInput(){
    // Retrieve the User's Input
    const user_input = document.getElementById("input").value

    // Send User Input as a String to back-end
    fetch("/create-task",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({message:user_input})
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById("input").value = ""  // clear the text box
        loadTasks()  // refresh the list
    })
}

loadTasks()  // load existing tasks when the page first opens
