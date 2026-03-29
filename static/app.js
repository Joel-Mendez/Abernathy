let currentTab = 'tasks'        // tracks which tab is active
let currentProject = null       // set when viewing a project's tasks
let currentTaskView = 'all'     // 'all' | 'priority' | 'project' | 'duedate' | 'status' | 'descendants' | 'progress'
let allTasks = []
let allProjects = []
let sandboxZoom = 1.0
let currentCalendarDate = null
let overduePromptShown = false

const DAY_BLOCKS = [
    ['wake_up',   'Wake Up (6–9am)'],
    ['morning',   'Morning (9am–12pm)'],
    ['lunch',     'Lunch (12–2pm)'],
    ['afternoon', 'Afternoon (2–5pm)'],
    ['evening',   'Evening (5–9pm)'],
    ['nighttime', 'Nighttime (9–10pm)'],
]
const DAY_BLOCK_MAP = Object.fromEntries(DAY_BLOCKS)

// Recursively count all descendants of a task.
// Score = sum of (child_score + 1) for each direct child, transitively.
function countDescendants(taskId, taskMap, memo, visited = new Set()) {
    if (taskId in memo) return memo[taskId]
    if (visited.has(taskId)) return 0  // cycle guard
    visited.add(taskId)
    const task = taskMap[taskId]
    if (!task || task.child_ids.length === 0) return (memo[taskId] = 0)
    let score = 0
    for (const childId of task.child_ids) {
        score += countDescendants(childId, taskMap, memo, new Set(visited)) + 1
    }
    return (memo[taskId] = score)
}

// Collect all transitive ancestor IDs of a task.
function getAllAncestorIds(taskId, taskMap, visited = new Set()) {
    if (visited.has(taskId)) return visited
    visited.add(taskId)
    const task = taskMap[taskId]
    if (task) task.parent_ids.forEach(pid => getAllAncestorIds(pid, taskMap, visited))
    return visited
}

// Collect all transitive descendant IDs of a task (for cycle/loop prevention).
function getAllDescendantIds(taskId, taskMap, visited = new Set()) {
    if (visited.has(taskId)) return visited
    visited.add(taskId)
    const task = taskMap[taskId]
    if (task) task.child_ids.forEach(cid => getAllDescendantIds(cid, taskMap, visited))
    return visited
}

// Recursively count all non-completed/non-cancelled ancestors of a task.
function countAncestors(taskId, taskMap, memo, visited = new Set()) {
    if (taskId in memo) return memo[taskId]
    if (visited.has(taskId)) return 0  // cycle guard
    visited.add(taskId)
    const task = taskMap[taskId]
    if (!task || task.parent_ids.length === 0) return (memo[taskId] = 0)
    let score = 0
    for (const parentId of task.parent_ids) {
        const parent = taskMap[parentId]
        if (!parent || ['Completed', 'Cancelled'].includes(parent.status)) continue
        score += countAncestors(parentId, taskMap, memo, new Set(visited)) + 1
    }
    return (memo[taskId] = score)
}

function loadTasks(){
    const showToggle = (currentTab === 'tasks' || currentProject !== null) && currentTab !== 'calendar'
    document.getElementById("sort-menu-wrap").style.display = showToggle ? "" : "none"
    document.getElementById("sort-option-project").style.display = currentProject !== null ? "none" : ""
    Promise.all([
        fetch("/tasks").then(r => r.json()),
        fetch("/projects").then(r => r.json())
    ])
    .then(([fetchedTasks, fetchedProjects]) => {
        allTasks = fetchedTasks
        allProjects = fetchedProjects
        renderContent()
    })
}

function checkOverdueTasks() {
    if (overduePromptShown) return
    const todayStr = new Date().toISOString().split('T')[0]
    const overdue = allTasks.filter(t =>
        t.due_date &&
        t.due_date < todayStr &&
        !['Completed', 'Cancelled'].includes(t.status)
    )
    if (overdue.length === 0) return
    overduePromptShown = true
    showOverdueModal(overdue)
}

function showOverdueModal(overdueTasks) {
    const content = document.getElementById("overdue-modal-content")
    content.innerHTML = ""

    const title = document.createElement("h2")
    title.textContent = `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`
    title.style.cssText = "margin: 0 0 16px; font-size: 16px;"
    content.appendChild(title)

    const todayStr = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    overdueTasks.forEach(task => {
        const row = document.createElement("div")
        row.className = "overdue-row"
        row.id = `overdue-row-${task.id}`

        const nameDiv = document.createElement("div")
        nameDiv.className = "overdue-name"
        nameDiv.textContent = task.name
        row.appendChild(nameDiv)

        const [y, mo, d] = task.due_date.split('-').map(Number)
        const dt = new Date(y, mo - 1, d)
        const wd = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
        const mn = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
        const dueDiv = document.createElement("div")
        dueDiv.className = "overdue-due"
        dueDiv.textContent = `Due ${wd[dt.getDay()]} ${mn[dt.getMonth()]} ${dt.getDate()}, ${y}`
        row.appendChild(dueDiv)

        const actionsDiv = document.createElement("div")
        actionsDiv.className = "overdue-actions"

        const todayBtn = document.createElement("button")
        todayBtn.className = "overdue-btn"
        todayBtn.textContent = "Today"
        todayBtn.addEventListener("click", () => {
            fetch(`/tasks/${task.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({due_date: todayStr})
            }).then(r => r.json()).then(() => { removeOverdueRow(task.id); loadTasks() })
        })
        actionsDiv.appendChild(todayBtn)

        const dateInput = document.createElement("input")
        dateInput.type = "date"
        dateInput.className = "overdue-date-input"
        dateInput.value = tomorrowStr
        dateInput.min = todayStr

        const postponeBtn = document.createElement("button")
        postponeBtn.className = "overdue-btn"
        postponeBtn.textContent = "Postpone"
        postponeBtn.addEventListener("click", () => {
            if (!dateInput.value) return
            fetch(`/tasks/${task.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({due_date: dateInput.value})
            }).then(r => r.json()).then(() => { removeOverdueRow(task.id); loadTasks() })
        })
        actionsDiv.appendChild(dateInput)
        actionsDiv.appendChild(postponeBtn)

        const deleteBtn = document.createElement("button")
        deleteBtn.className = "overdue-btn overdue-btn-delete"
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'
        deleteBtn.addEventListener("click", () => {
            fetch(`/tasks/${task.id}`, { method: "DELETE" })
                .then(r => r.json())
                .then(() => { removeOverdueRow(task.id); loadTasks() })
        })
        actionsDiv.appendChild(deleteBtn)

        row.appendChild(actionsDiv)
        content.appendChild(row)
    })

    document.getElementById("overdue-modal-overlay").style.display = "flex"
}

function removeOverdueRow(taskId) {
    const row = document.getElementById(`overdue-row-${taskId}`)
    if (!row) return
    row.remove()
    const remaining = document.getElementById("overdue-modal-content").querySelectorAll('.overdue-row')
    if (remaining.length === 0) closeOverdueModal()
}

function closeOverdueModal() {
    document.getElementById("overdue-modal-overlay").style.display = "none"
}

function renderContent() {
    checkOverdueTasks()
    if (currentTab === 'projects' && currentProject === null) {
        renderProjectList()
        return
    }

    updatePageHeader()

    const isProgressView = currentTab === 'progress' || currentTaskView === 'progress'

    // Filter tasks based on active view
    const tasks = currentProject !== null
        ? currentTaskView === 'progress'
            ? allTasks.filter(t => t.status === 'Completed' && t.project_id === currentProject.id)
                .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))
            : allTasks.filter(t => t.status !== 'Completed' && t.project_id === currentProject.id)
        : currentTab === 'calendar' && currentCalendarDate !== null
            ? allTasks.filter(t => t.due_date === currentCalendarDate)
                .sort((a, b) => {
                    const order = ['Completed', 'In Progress', 'To-Do', 'Waiting', 'Blocked', 'Backlog', 'Cancelled']
                    const ai = order.indexOf(a.status), bi = order.indexOf(b.status)
                    if (ai !== bi) return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi)
                    if (a.status === 'Completed' && b.status === 'Completed')
                        return new Date(a.date_completed) - new Date(b.date_completed)
                    return 0
                })
        : currentTab === 'tasks' || currentTab === 'calendar'
            ? allTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
            : allTasks
                .filter(t => t.status === 'Completed')
                .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))

    const list = document.getElementById("task-list")
    list.innerHTML = ""

    if (currentProject !== null) {
        const tasksHeader = document.createElement("h3")
        tasksHeader.textContent = "Tasks"
        list.appendChild(tasksHeader)
    }

    const taskMap = Object.fromEntries(allTasks.map(t => [t.id, t]))
    const memo = {}

    if (currentTaskView === 'tree') {
        renderTreeView(list, tasks, taskMap)
        return
    }

    if (currentTaskView === 'sandbox') {
        renderSandboxView(list, taskMap)
        return
    }

    renderTaskList(list, tasks, taskMap, memo, isProgressView)
}

function updatePageHeader() {
    if (currentProject !== null) {
        document.getElementById("add-btn").style.display = currentTaskView === 'progress' ? "none" : ""
        document.getElementById("add-task").style.display = "none"
        document.getElementById("back-btn").style.display = ""
        document.getElementById("tab-title").textContent = currentProject.name
        document.getElementById("sort-option-progress").style.display = ""
    } else if (currentTab === 'calendar' && currentCalendarDate !== null) {
        const [y, mo, d] = currentCalendarDate.split('-').map(Number)
        const dt = new Date(y, mo - 1, d)
        const wd = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
        const mn = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
        document.getElementById("tab-title").textContent = `${wd[dt.getDay()]} ${mn[dt.getMonth()]} ${dt.getDate()}, ${y}`
        document.getElementById("back-btn").style.display = ""
        document.getElementById("sort-option-progress").style.display = "none"
    } else {
        document.getElementById("back-btn").style.display = "none"
        document.getElementById("sort-option-progress").style.display = "none"
    }

    // Only show the + button on the Tasks tab and calendar day view; always close the form on tab switch
    if (currentProject === null) {
        const showAdd = currentTab === 'tasks' || (currentTab === 'calendar' && currentCalendarDate !== null)
        document.getElementById("add-btn").style.display = showAdd ? "" : "none"
        document.getElementById("add-task").style.display = "none"
    }
}

function renderProjectList() {
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
                    fetch(`/projects/${project.id}`, {
                        method: "PATCH",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({name: input.value})
                    })
                    .then(r => r.json())
                    .then(() => loadTasks())
                }
            })
            item.appendChild(editBtn)

            const deleteBtn = document.createElement("button")
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'
            deleteBtn.addEventListener("click", () => {
                fetch(`/projects/${project.id}`, {
                    method: "DELETE"
                })
                .then(r => r.json())
                .then(() => loadTasks())
            })
            item.appendChild(deleteBtn)

            list.appendChild(item)
    })
}

function renderTreeView(list, tasks, taskMap) {
    const taskIds = new Set(tasks.map(t => t.id))
    const roots = tasks
        .filter(t => t.parent_ids.filter(pid => taskIds.has(pid)).length === 0)
        .sort((a, b) => a.name.localeCompare(b.name))
    const visited = new Set()
    const treeStatusColors = {
        'In Progress': '#4a90d9', 'Waiting': '#e8943a', 'Blocked': '#bbb',
        'Backlog': '#9b7fd4', 'Completed': '#5aad6f', 'Cancelled': '#c0392b',
    }
    const renderNode = (task, depth, isLast, parentPrefix) => {
        if (visited.has(task.id)) return
        visited.add(task.id)
        const connector   = depth === 0 ? '' : (isLast ? '└─ ' : '├─ ')
        const childPrefix = depth === 0 ? '' : parentPrefix + (isLast ? '   ' : '│  ')
        const item = document.createElement("li")
        item.className = "tree-node"
        if (depth > 0) {
            const pre = document.createElement("span")
            pre.className = "tree-prefix"
            pre.textContent = parentPrefix + connector
            item.appendChild(pre)
        }
        const nameSpan = document.createElement("span")
        nameSpan.textContent = task.name
        nameSpan.className = "task-name-link"
        if (treeStatusColors[task.status]) nameSpan.style.color = treeStatusColors[task.status]
        nameSpan.addEventListener("click", () => showTaskModal(task))
        item.appendChild(nameSpan)
        list.appendChild(item)
        const children = task.child_ids
            .map(cid => taskMap[cid])
            .filter(c => c && taskIds.has(c.id) && !visited.has(c.id))
            .sort((a, b) => a.name.localeCompare(b.name))
        children.forEach((child, i) => renderNode(child, depth + 1, i === children.length - 1, childPrefix))
    }
    roots.forEach((root, i) => renderNode(root, 0, i === roots.length - 1, ''))
}

function renderSandboxView(list, taskMap) {
    const sandboxTasks = (currentProject !== null
        ? allTasks.filter(t => t.project_id === currentProject.id)
        : allTasks
    ).filter(t => !['Completed', 'Cancelled'].includes(t.status))
    const sandboxIds = new Set(sandboxTasks.map(t => t.id))

    // Assign depth = longest path from any root
    const depthMap = new Map()
    const assignDepth = (taskId, depth, visiting = new Set()) => {
        if (visiting.has(taskId)) return  // cycle guard
        if ((depthMap.get(taskId) ?? -1) >= depth) return
        depthMap.set(taskId, depth)
        const t = taskMap[taskId]
        if (t) {
            visiting.add(taskId)
            t.child_ids.forEach(cid => assignDepth(cid, depth + 1, new Set(visiting)))
        }
    }
    sandboxTasks
        .filter(t => t.parent_ids.filter(pid => sandboxIds.has(pid)).length === 0)
        .forEach(r => assignDepth(r.id, 0))
    sandboxTasks.forEach(t => { if (!depthMap.has(t.id)) depthMap.set(t.id, 0) })

    // Group by depth
    const byDepth = new Map()
    sandboxTasks.forEach(t => {
        const d = depthMap.get(t.id) ?? 0
        if (!byDepth.has(d)) byDepth.set(d, [])
        byDepth.get(d).push(t)
    })

    const NODE_W = 80, NODE_H = 80, H_GAP = 24, V_GAP = 64
    const depths = [...byDepth.keys()].sort((a, b) => a - b)
    const maxRowLen = Math.max(...depths.map(d => byDepth.get(d).length), 1)
    const totalW = Math.max(maxRowLen * (NODE_W + H_GAP) - H_GAP, 300)
    const totalH = depths.length * (NODE_H + V_GAP) - V_GAP + 24

    // Compute positions
    const posMap = new Map()
    depths.forEach(d => {
        const row = byDepth.get(d)
        const rowW = row.length * (NODE_W + H_GAP) - H_GAP
        const startX = (totalW - rowW) / 2
        row.forEach((t, i) => {
            posMap.set(t.id, { x: startX + i * (NODE_W + H_GAP), y: d * (NODE_H + V_GAP) + 8 })
        })
    })

    const container = document.createElement("div")
    container.style.cssText = `position:relative;width:${totalW}px;height:${totalH}px;min-width:100%`

    // SVG edges
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none"

    sandboxTasks.forEach(t => {
        const p = posMap.get(t.id)
        if (!p) return
        t.child_ids.forEach(cid => {
            const c = posMap.get(cid)
            if (!c) return
            const x1 = p.x + NODE_W / 2, y1 = p.y + NODE_H
            const x2 = c.x + NODE_W / 2, y2 = c.y
            const cy = (y1 + y2) / 2
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
            path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`)
            path.setAttribute("fill", "none")
            path.setAttribute("stroke", "#ccc")
            path.setAttribute("stroke-width", "1.5")
            svg.appendChild(path)
        })
    })
    container.appendChild(svg)

    const sbColors = { 'In Progress': '#4a90d9', 'Waiting': '#e8943a', 'Blocked': '#bbb', 'Backlog': '#9b7fd4', 'Completed': '#5aad6f', 'Cancelled': '#c0392b' }
    sandboxTasks.forEach(t => {
        const pos = posMap.get(t.id)
        if (!pos) return
        const node = document.createElement("div")
        node.className = "sandbox-node"
        node.style.left = pos.x + "px"
        node.style.top = pos.y + "px"
        node.style.borderColor = sbColors[t.status] || '#ddd'
        node.textContent = t.name
        node.addEventListener("click", () => showTaskModal(t))
        container.appendChild(node)
    })

    // Zoom controls
    container.style.transformOrigin = "top left"
    container.style.transform = `scale(${sandboxZoom})`
    container.style.position = "absolute"
    container.style.top = "0"
    container.style.left = "0"

    const sizer = document.createElement("div")
    sizer.style.position = "relative"
    sizer.style.width = Math.round(totalW * sandboxZoom) + "px"
    sizer.style.height = Math.round(totalH * sandboxZoom) + "px"
    sizer.appendChild(container)

    const scrollArea = document.createElement("div")
    scrollArea.style.cssText = "overflow:auto;height:calc(100vh - 180px)"
    scrollArea.appendChild(sizer)

    const applyZoom = () => {
        container.style.transform = `scale(${sandboxZoom})`
        sizer.style.width = Math.round(totalW * sandboxZoom) + "px"
        sizer.style.height = Math.round(totalH * sandboxZoom) + "px"
        zoomLabel.textContent = Math.round(sandboxZoom * 100) + "%"
    }

    const btnStyle = "background:none;border:1px solid #ccc;border-radius:4px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px"
    const zoomOutBtn = document.createElement("button")
    zoomOutBtn.innerHTML = '<i class="fa-solid fa-minus"></i>'
    zoomOutBtn.style.cssText = btnStyle
    zoomOutBtn.addEventListener("click", () => { sandboxZoom = Math.max(0.25, sandboxZoom - 0.15); applyZoom() })

    const zoomLabel = document.createElement("span")
    zoomLabel.style.cssText = "font-size:12px;color:#555;min-width:38px;text-align:center"
    zoomLabel.textContent = Math.round(sandboxZoom * 100) + "%"

    const zoomInBtn = document.createElement("button")
    zoomInBtn.innerHTML = '<i class="fa-solid fa-plus"></i>'
    zoomInBtn.style.cssText = btnStyle
    zoomInBtn.addEventListener("click", () => { sandboxZoom = Math.min(2.5, sandboxZoom + 0.15); applyZoom() })

    const zoomBar = document.createElement("div")
    zoomBar.style.cssText = "display:flex;align-items:center;gap:4px;margin-bottom:8px"
    zoomBar.appendChild(zoomOutBtn)
    zoomBar.appendChild(zoomLabel)
    zoomBar.appendChild(zoomInBtn)

    const outerDiv = document.createElement("div")
    outerDiv.appendChild(zoomBar)
    outerDiv.appendChild(scrollArea)

    const wrapper = document.createElement("li")
    wrapper.style.cssText = "list-style:none;padding:8px 0"
    wrapper.appendChild(outerDiv)
    list.appendChild(wrapper)
}

function renderTaskList(list, tasks, taskMap, memo, isProgressView) {
    // Group tasks for the active view mode
    let taskGroups = [{ header: null, items: tasks, dateKey: null }]
    if (currentTab === 'calendar' && currentCalendarDate !== null) {
        const blockKeys = DAY_BLOCKS.map(([k]) => k)
        const buckets = new Map(DAY_BLOCKS.map(([k, l]) => [k, { header: l, items: [], dateKey: k }]))
        buckets.set('none', { header: 'Unscheduled', items: [], dateKey: 'none' })
        tasks.forEach(t => {
            const key = t.day_block && blockKeys.includes(t.day_block) ? t.day_block : 'none'
            buckets.get(key).items.push(t)
        })
        taskGroups = [...blockKeys, 'none']
            .map(k => buckets.get(k))
            .filter(g => g.items.length > 0)
    } else if (isProgressView) {
        // no grouping — progress view is always flat, date-bucketed via date headers in render loop
    } else if (currentTaskView === 'descendants') {
        const sorted = [...tasks].sort((a, b) =>
            countDescendants(b.id, taskMap, memo) - countDescendants(a.id, taskMap, memo)
        )
        taskGroups = [{ header: null, items: sorted }]
    } else if (currentTaskView === 'pressure') {
        const today = new Date(); today.setHours(0,0,0,0)
        const pressureScore = t => {
            const descCount = countDescendants(t.id, taskMap, memo)
            if (!t.due_date) return 0.1 * descCount
            const [y, mo, d] = t.due_date.split('-').map(Number)
            const due = new Date(y, mo - 1, d)
            const daysUntilDue = (due - today) / 86400000  // positive = future, negative = overdue
            return 1 / Math.max(0.5, daysUntilDue) + 0.1 * descCount
        }
        window._pressureMap = new Map(tasks.map(t => [t.id, pressureScore(t)]))
        const sorted = [...tasks].sort((a, b) => pressureScore(b) - pressureScore(a))
        taskGroups = [{ header: null, items: sorted }]
    } else if (currentTaskView && currentTaskView !== 'all') {
        const buckets = new Map()
        tasks.forEach(t => {
            let key, label
            if (currentTaskView === 'priority') {
                key = t.priority || 0
                const pl = { 0: 'No Priority', 1: '1 — Minimal', 2: '2 — Routine', 3: '3 — Important', 4: '4 — Urgent', 5: '5 — Critical' }
                label = pl[key]
            } else if (currentTaskView === 'effort') {
                key = t.effort || 0
                const el = { 0: 'No Effort', 1: '1 — Trivial', 2: '2 — Small', 3: '3 — Medium', 4: '4 — Large', 5: '5 — Massive' }
                label = el[key]
            } else if (currentTaskView === 'project') {
                const proj = allProjects.find(p => p.id === t.project_id)
                key = proj ? proj.id : 0
                label = proj ? proj.name : 'No Project'
            } else if (currentTaskView === 'status') {
                key = label = t.status || 'No Status'
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
        if (currentTaskView === 'priority' || currentTaskView === 'effort') {
            entries.sort(([a], [b]) => { if (a === 0) return 1; if (b === 0) return -1; return b - a })
        } else if (currentTaskView === 'project') {
            entries.sort(([, av], [, bv]) => { if (av.header === 'No Project') return 1; if (bv.header === 'No Project') return -1; return av.header.localeCompare(bv.header) })
        } else if (currentTaskView === 'status') {
            const order = ['In Progress', 'To-Do', 'Waiting', 'Blocked', 'Backlog', 'Completed', 'Cancelled']
            entries.sort(([a], [b]) => {
                const ai = order.indexOf(a), bi = order.indexOf(b)
                if (ai === -1) return 1; if (bi === -1) return -1
                return ai - bi
            })
        } else {
            entries.sort(([a], [b]) => { if (a === 'No Due Date') return 1; if (b === 'No Due Date') return -1; return a.localeCompare(b) })
        }
        taskGroups = entries.map(([key, g]) => ({ ...g, dateKey: key }))
    }

    // Flatten into a render sequence, inserting group header sentinels
    const renderItems = []
    taskGroups.forEach(({ header, items, dateKey }) => {
        if (header !== null) renderItems.push({ task: null, groupHeader: header, dateKey: dateKey ?? null })
        items.forEach(task => renderItems.push({ task, groupHeader: null, dateKey: null }))
    })

    let currentDate = null
    renderItems.forEach(({ task, groupHeader, dateKey }) => {
        if (groupHeader !== null) {
            const h = document.createElement('h3')
            h.textContent = groupHeader
            if (currentTab === 'calendar' && dateKey && dateKey !== 'No Due Date') {
                h.style.cursor = 'pointer'
                h.addEventListener('click', () => {
                    currentCalendarDate = dateKey
                    loadTasks()
                })
            }
            list.appendChild(h)
            return
        }
        // Insert a date header whenever the date changes (Progress tab only)
        if (isProgressView) {
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

        if (isProgressView) {
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
                fetch(`/tasks/${task.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({status: newStatus})
                })
                .then(response => response.json())
                .then(() => loadTasks())  // refresh so task moves to correct tab
            })
            item.appendChild(checkbox)
        }

        // Use a span for the name so it can be swapped with an input on edit
        const nameSpan = document.createElement("span")
        nameSpan.textContent = isProgressView ? task.name : task.name + " "
        nameSpan.className = "task-name-link"

        const statusColors = {
            'In Progress': '#4a90d9',
            'Waiting':     '#e8943a',
            'Blocked':     '#bbb',
            'Backlog':     '#9b7fd4',
            'Completed':   '#5aad6f',
            'Cancelled':   '#c0392b',
        }
        if (statusColors[task.status]) nameSpan.style.color = statusColors[task.status]
        nameSpan.addEventListener("click", () => showTaskModal(task))
        item.appendChild(nameSpan)

        if (currentTaskView === 'pressure' && window._pressureMap) {
            const score = window._pressureMap.get(task.id) ?? 0
            const pb = document.createElement("span")
            pb.className = "pressure-badge"
            pb.textContent = score.toFixed(1)
            item.appendChild(pb)
        }

        if (!isProgressView) {
            const ancIds = [...getAllAncestorIds(task.id, taskMap)]
                .filter(id => id !== task.id)
                .filter(id => { const t = taskMap[id]; return t && !['Completed', 'Cancelled'].includes(t.status) })
            const descIds = [...getAllDescendantIds(task.id, taskMap)].filter(id => id !== task.id)
            const badge = document.createElement("span")
            badge.className = "descendants-badge"
            const ancSpan = document.createElement("span")
            ancSpan.textContent = ancIds.length
            const sep = document.createElement("span")
            sep.textContent = "|"
            sep.className = "descendants-sep"
            const descSpan = document.createElement("span")
            descSpan.textContent = descIds.length
            badge.appendChild(ancSpan)
            badge.appendChild(sep)
            badge.appendChild(descSpan)

            // Tooltip with ancestor/descendant names
            const tooltip = document.createElement("div")
            tooltip.className = "badge-tooltip"

            const ancLabel = document.createElement("div")
            ancLabel.className = "badge-tooltip-section"
            ancLabel.textContent = "Ancestors"
            tooltip.appendChild(ancLabel)
            if (ancIds.length === 0) {
                const none = document.createElement("div")
                none.className = "badge-tooltip-item badge-tooltip-none"
                none.textContent = "none"
                tooltip.appendChild(none)
            } else {
                ancIds.forEach(id => {
                    const t = taskMap[id]
                    if (!t) return
                    const row = document.createElement("div")
                    row.className = "badge-tooltip-item"
                    if (task.parent_ids.includes(id)) row.classList.add("badge-tooltip-direct")
                    row.textContent = t.name
                    tooltip.appendChild(row)
                })
            }

            const descLabel = document.createElement("div")
            descLabel.className = "badge-tooltip-section"
            descLabel.textContent = "Descendants"
            tooltip.appendChild(descLabel)
            if (descIds.length === 0) {
                const none = document.createElement("div")
                none.className = "badge-tooltip-item badge-tooltip-none"
                none.textContent = "none"
                tooltip.appendChild(none)
            } else {
                descIds.forEach(id => {
                    const t = taskMap[id]
                    if (!t) return
                    const row = document.createElement("div")
                    row.className = "badge-tooltip-item"
                    if (task.child_ids.includes(id)) row.classList.add("badge-tooltip-direct")
                    row.textContent = t.name
                    tooltip.appendChild(row)
                })
            }

            badge.appendChild(tooltip)
            item.appendChild(badge)
        }

        if (!isProgressView && task.project_id && currentProject === null) {
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

        list.appendChild(item)
    })

    if (currentProject !== null) {
        const notesHeader = document.createElement("h3")
        notesHeader.textContent = "Notes"
        list.appendChild(notesHeader)

        const notesItem = document.createElement("li")
        notesItem.style.listStyle = "none"
        const notesArea = document.createElement("textarea")
        notesArea.className = "modal-notes"
        notesArea.style.width = "100%"
        notesArea.style.color = "#333"
        notesArea.style.borderBottomColor = "rgba(0,0,0,0.15)"
        notesArea.value = currentProject.notes || ""
        notesArea.placeholder = "Add project notes..."
        notesArea.addEventListener("blur", () => {
            fetch(`/projects/${currentProject.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({notes: notesArea.value})
            }).then(r => r.json()).then(() => {
                currentProject.notes = notesArea.value
            })
        })
        notesItem.appendChild(notesArea)
        list.appendChild(notesItem)
    }
}

const viewLabels = { all: 'All Tasks', priority: 'Priority', project: 'Project', duedate: 'Due Date', status: 'Status', descendants: 'Descendants', effort: 'Effort', pressure: 'Pressure', tree: 'Tree', sandbox: 'Sandbox', progress: 'Progress' }

function updateSortUI() {
    document.querySelectorAll('.sort-option').forEach(el => {
        el.classList.toggle('active', el.dataset.view === currentTaskView)
    })
    document.getElementById('sort-label').textContent = viewLabels[currentTaskView] || 'All Tasks'
}

function toggleSortMenu() {
    const menu = document.getElementById('sort-menu')
    menu.style.display = menu.style.display === 'none' ? '' : 'none'
}

document.addEventListener('click', e => {
    const wrap = document.getElementById('sort-menu-wrap')
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById('sort-menu').style.display = 'none'
    }
})

function switchTab(tab) {
    currentTab = tab
    currentProject = null
    currentCalendarDate = null
    currentTaskView = tab === 'calendar' ? 'duedate' : 'all'
    document.getElementById("tab-tasks").classList.toggle("active", tab === 'tasks')
    document.getElementById("tab-calendar").classList.toggle("active", tab === 'calendar')
    document.getElementById("tab-projects").classList.toggle("active", tab === 'projects')
    document.getElementById("tab-progress").classList.toggle("active", tab === 'progress')
    document.getElementById("tab-title").textContent = { tasks: "Tasks", calendar: "Calendar", projects: "Projects", progress: "Progress" }[tab]
    updateSortUI()
    loadTasks()
}

function setTaskView(view) {
    currentTaskView = (currentTaskView === view && view !== 'all') ? 'all' : view
    document.getElementById('sort-menu').style.display = 'none'
    updateSortUI()
    loadTasks()
}

function goBackToProjects() {
    if (currentCalendarDate !== null) {
        currentCalendarDate = null
    } else {
        currentProject = null
        currentTaskView = 'all'
    }
    updateSortUI()
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
    const isProject = currentTab === 'projects' && currentProject === null
    const url = isProject ? "/projects" : "/tasks"
    const body = isProject
        ? JSON.stringify({name: user_input})
        : JSON.stringify({name: user_input, project_id: currentProject ? currentProject.id : null})
    fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: body
    })
    .then(response => response.json())
    .then(newTask => {
        if (currentCalendarDate && newTask.id) {
            return fetch(`/tasks/${newTask.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({due_date: currentCalendarDate})
            })
        }
    })
    .then(() => {
        document.getElementById("input").value = ""
        document.getElementById("add-task").style.display = "none"
        loadTasks()
    })
}

document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendInput()
})

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeTaskModal()
    const tag = document.activeElement.tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
    if (e.key === "n" && (currentTab === "tasks" || currentProject !== null || (currentTab === "calendar" && currentCalendarDate !== null))) {
        e.preventDefault()
        toggleAddForm()
    }
})

function showTaskModal(task) {
    const taskMap = Object.fromEntries(allTasks.map(t => [t.id, t]))
    const content = document.getElementById("task-modal-content")
    content.innerHTML = ""

    const priorityLabels = { 1: "1 — Minimal", 2: "2 — Routine", 3: "3 — Important", 4: "4 — Urgent", 5: "5 — Critical" }
    const effortLabels   = { 1: "1 — Trivial",  2: "2 — Small",   3: "3 — Medium",   4: "4 — Large",  5: "5 — Massive" }

    const rows = [
        ["fa-pen-to-square", "Name",      task.name],
        ["fa-tag",           "Status",    task.status || "—"],
        ["fa-exclamation",   "Priority",  task.priority ? priorityLabels[task.priority] : "—"],
        ["fa-dumbbell",      "Effort",    task.effort   ? effortLabels[task.effort]     : "—"],
        ["fa-calendar",      "Due Date",  task.due_date ? task.due_date + (task.due_date_fixed ? "  ⚓ fixed" : "  flexible") : "—"],
        ["fa-folder",        "Project",   allProjects.find(p => p.id === task.project_id)?.name || "—"],
        ["fa-clock",         "Day Block", task.day_block ? DAY_BLOCK_MAP[task.day_block] : "—"],
    ]

    const makeSelect = (options, current, bodyFn) => {
        const select = document.createElement("select")
        select.className = "modal-select"
        options.forEach(([val, label]) => {
            const opt = document.createElement("option")
            opt.value = val
            opt.textContent = label
            if (val == (current ?? "")) opt.selected = true
            select.appendChild(opt)
        })
        select.addEventListener("change", () => {
            fetch(`/tasks/${task.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(bodyFn(select.value))
            }).then(r => r.json()).then(() => loadTasks())
        })
        return select
    }

    rows.forEach(([icon, label, value]) => {
        const row = document.createElement("div")
        row.className = "modal-row"
        const l = document.createElement("span")
        l.className = "modal-label"
        l.innerHTML = `<i class="fa-solid ${icon}"></i> ${label}`
        row.appendChild(l)

        if (label === "Name") {
            const input = document.createElement("input")
            input.type = "text"
            input.className = "modal-name-input"
            input.value = value
            input.addEventListener("change", () => {
                fetch(`/tasks/${task.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({name: input.value})
                }).then(r => r.json()).then(() => loadTasks())
            })
            row.appendChild(input)
        } else if (label === "Status") {
            const opts = [["To-Do","To-Do"],["In Progress","In Progress"],["Waiting","Waiting"],["Blocked","Blocked"],["Backlog","Backlog"],["Completed","Completed"],["Cancelled","Cancelled"]]
            row.appendChild(makeSelect(opts, task.status, v => ({status: v})))
        } else if (label === "Priority") {
            const opts = [[5,"5 — Critical"],[4,"4 — Urgent"],[3,"3 — Important"],[2,"2 — Routine"],[1,"1 — Minimal"],["","— none —"]]
            row.appendChild(makeSelect(opts, task.priority ?? "", v => ({priority: v ? parseInt(v) : null})))
        } else if (label === "Effort") {
            const opts = [[5,"5 — Massive"],[4,"4 — Large"],[3,"3 — Medium"],[2,"2 — Small"],[1,"1 — Trivial"],["","— none —"]]
            row.appendChild(makeSelect(opts, task.effort ?? "", v => ({effort: v ? parseInt(v) : null})))
        } else if (label === "Due Date") {
            const dateWrap = document.createElement("span")
            dateWrap.style.display = "flex"
            dateWrap.style.alignItems = "center"
            dateWrap.style.gap = "8px"

            const dateInput = document.createElement("input")
            dateInput.type = "date"
            dateInput.className = "modal-name-input"
            dateInput.value = task.due_date || ""
            dateInput.addEventListener("change", () => {
                fetch(`/tasks/${task.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({due_date: dateInput.value || null})
                }).then(r => r.json()).then(() => loadTasks())
            })
            dateWrap.appendChild(dateInput)

            const anchorBtn = document.createElement("button")
            anchorBtn.innerHTML = '<i class="fa-solid fa-anchor"></i>'
            anchorBtn.title = task.due_date_fixed ? "Fixed (click to make flexible)" : "Flexible (click to fix)"
            anchorBtn.style.background = "none"
            anchorBtn.style.border = "none"
            anchorBtn.style.cursor = "pointer"
            anchorBtn.style.color = task.due_date_fixed ? "#4a90d9" : "rgba(255,255,255,0.3)"
            anchorBtn.addEventListener("click", () => {
                const newFixed = !task.due_date_fixed
                fetch(`/tasks/${task.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({due_date_fixed: newFixed})
                }).then(r => r.json()).then(() => { task.due_date_fixed = newFixed ? 1 : 0; anchorBtn.style.color = newFixed ? "#4a90d9" : "rgba(255,255,255,0.3)"; anchorBtn.title = newFixed ? "Fixed (click to make flexible)" : "Flexible (click to fix)" })
            })
            dateWrap.appendChild(anchorBtn)

            if (task.due_date) {
                const clearBtn = document.createElement("button")
                clearBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>'
                clearBtn.title = "Remove due date"
                clearBtn.style.cssText = "background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-size:13px;padding:0"
                clearBtn.addEventListener("click", () => {
                    fetch(`/tasks/${task.id}`, {
                        method: "PATCH",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({due_date: null, due_date_fixed: false})
                    }).then(r => r.json()).then(() => loadTasks())
                })
                dateWrap.appendChild(clearBtn)
            }

            row.appendChild(dateWrap)
        } else if (label === "Project") {
            const opts = [["","— no project —"], ...allProjects.map(p => [p.id, p.name])]
            row.appendChild(makeSelect(opts, task.project_id ?? "", v => ({project_id: v || null})))
        } else if (label === "Day Block") {
            const opts = [["","— none —"], ...DAY_BLOCKS]
            row.appendChild(makeSelect(opts, task.day_block ?? "", v => ({day_block: v || null})))
        } else {
            const v = document.createElement("span")
            v.textContent = value
            row.appendChild(v)
        }

        content.appendChild(row)
    })

    // Notes
    const notesRow = document.createElement("div")
    notesRow.className = "modal-row modal-row-rel"
    const notesLabel = document.createElement("span")
    notesLabel.className = "modal-label"
    notesLabel.innerHTML = '<i class="fa-solid fa-note-sticky"></i> Notes'
    const notesArea = document.createElement("textarea")
    notesArea.className = "modal-notes"
    notesArea.value = task.notes || ""
    notesArea.placeholder = "Add notes..."
    notesArea.addEventListener("blur", () => {
        fetch(`/tasks/${task.id}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({notes: notesArea.value})
        }).then(r => r.json()).then(() => {
            task.notes = notesArea.value
        })
    })
    notesRow.appendChild(notesLabel)
    notesRow.appendChild(notesArea)
    content.appendChild(notesRow)

    // Ancestors
    const ancIds = [...getAllAncestorIds(task.id, taskMap)]
        .filter(id => id !== task.id)
        .filter(id => { const t = taskMap[id]; return t && !['Completed', 'Cancelled'].includes(t.status) })
    const descIds = [...getAllDescendantIds(task.id, taskMap)].filter(id => id !== task.id)

    // ids = all transitive ancestors/descendants; directIds = direct parents/children (removable + highlighted)
    const addRelSection = (icon, label, ids, directIds, parentOrChild) => {
        const row = document.createElement("div")
        row.className = "modal-row modal-row-rel"
        const l = document.createElement("span")
        l.className = "modal-label"
        l.innerHTML = `<i class="fa-solid ${icon}"></i> ${label}`
        row.appendChild(l)

        const wrap = document.createElement("span")
        wrap.style.display = "flex"
        wrap.style.alignItems = "center"
        wrap.style.flexWrap = "wrap"
        wrap.style.gap = "4px"

        const sortedIds = [...ids].sort((a, b) => {
            const aD = directIds.includes(a), bD = directIds.includes(b)
            return aD === bD ? 0 : aD ? -1 : 1
        })
        sortedIds.forEach((id, i) => {
                const t = taskMap[id]
                if (!t) return
                const isDirect = directIds.includes(id)
                if (isDirect) {
                    const tag = document.createElement("span")
                    tag.className = "modal-dep-tag modal-direct"
                    tag.textContent = t.name + " "
                    const removeBtn = document.createElement("button")
                    removeBtn.textContent = "×"
                    removeBtn.className = "modal-dep-remove"
                    removeBtn.addEventListener("click", () => {
                        const parentId = parentOrChild === 'parent' ? id : task.id
                        const childId  = parentOrChild === 'parent' ? task.id : id
                        fetch(`/tasks/${parentId}/dependencies/${childId}`, {
                            method: "DELETE"
                        }).then(r => r.json()).then(() => loadTasks())
                    })
                    tag.appendChild(removeBtn)
                    wrap.appendChild(tag)
                } else {
                    const s = document.createElement("span")
                    s.textContent = t.name
                    wrap.appendChild(s)
                    if (i < sortedIds.length - 1) wrap.appendChild(document.createTextNode(", "))
                }
            })

            const exclusions = parentOrChild === 'parent'
                ? getAllDescendantIds(task.id, taskMap)
                : getAllAncestorIds(task.id, taskMap)
            const addSelect = document.createElement("select")
            addSelect.className = "modal-select modal-dep-select"
            const placeholder = document.createElement("option")
            placeholder.value = ""
            placeholder.textContent = "+ add"
            placeholder.disabled = true
            placeholder.selected = true
            addSelect.appendChild(placeholder)
            allTasks.forEach(other => {
                if (other.id === task.id) return
                if (directIds.includes(other.id)) return
                if (exclusions.has(other.id)) return
                if (['Completed', 'Cancelled'].includes(other.status)) return
                const opt = document.createElement("option")
                opt.value = other.id
                opt.textContent = other.name
                addSelect.appendChild(opt)
            })
            addSelect.addEventListener("change", () => {
                const selectedId = parseInt(addSelect.value)
                const parentId = parentOrChild === 'parent' ? selectedId : task.id
                const childId  = parentOrChild === 'parent' ? task.id : selectedId
                fetch(`/tasks/${parentId}/dependencies`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({child_id: childId})
                }).then(r => r.json()).then(() => loadTasks())
            })
            wrap.appendChild(addSelect)

        row.appendChild(wrap)
        content.appendChild(row)
    }

    addRelSection("fa-people-group", "Ancestors",   ancIds,  task.parent_ids, "parent")
    addRelSection("fa-child",        "Descendants", descIds, task.child_ids,  "child")

    const deleteBtn = document.createElement("button")
    deleteBtn.className = "modal-delete-btn"
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete task'
    deleteBtn.addEventListener("click", () => {
        fetch(`/tasks/${task.id}`, {
            method: "DELETE"
        }).then(r => r.json()).then(() => { closeTaskModal(); loadTasks() })
    })
    content.appendChild(deleteBtn)

    document.getElementById("task-modal-overlay").style.display = "flex"
}

function closeTaskModal() {
    if (document.activeElement) document.activeElement.blur()
    document.getElementById("task-modal-overlay").style.display = "none"
}

loadTasks()  // load existing tasks when the page first opens
