function loadTasks(){
    fetch("/tasks")
    .then(response => response.json())
    .then(tasks => {
        const list = document.getElementById("task-list")
        list.innerHTML = ""  // clear the list before re-rendering
        tasks.forEach(task => {
            const item = document.createElement("li")

            // Checkbox: checked when status is Completed, unchecked otherwise
            const checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.checked = task.status === "Completed"
            checkbox.addEventListener("change", () => {
                const newStatus = checkbox.checked ? "Completed" : "To-Do"
                select.value = newStatus  // keep dropdown in sync
                fetch("/update-status", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({id: task.id, status: newStatus})
                })
            })
            item.appendChild(checkbox)

            // Use a span for the name so it can be swapped with an input on edit
            const nameSpan = document.createElement("span")
            nameSpan.textContent = task.name + " "
            item.appendChild(nameSpan)

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
            })
            item.appendChild(select)

            const editBtn = document.createElement("button")
            editBtn.textContent = "Edit"
            editBtn.addEventListener("click", () => {
                if (editBtn.textContent === "Edit") {
                    // Switch to edit mode: replace span with a text input
                    const input = document.createElement("input")
                    input.type = "text"
                    input.value = nameSpan.textContent.trim()
                    item.replaceChild(input, nameSpan)
                    editBtn.textContent = "Save"
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
            deleteBtn.textContent = "Delete"
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

            list.appendChild(item)
        })
    })
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
