document.addEventListener("DOMContentLoaded", function () {
  const todoList = document.getElementById("todo-list");
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  async function fetchTodos() {
    try {
      const response = await fetch("/todo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const todos = await response.json();
        displayTodos(todos);
      } else {
        alert("Failed to fetch todos.");
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
      alert("An error occurred while fetching todos.");
    }
  }

  async function addTodo() {
    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-description").value;
    const status = document.getElementById("todo-status").value;

    if (!title || !description || !status) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch("/todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, status }),
      });

      if (response.ok) {
        await fetchTodos();
        // Clear input fields
        document.getElementById("todo-title").value = "";
        document.getElementById("todo-description").value = "";
        document.getElementById("todo-status").value = "progress";
      } else {
        alert("Failed to add todo.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding the todo.");
    }
  }

  async function updateTodo() {
    const id = document.getElementById("todo-id").value;
    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-description").value;
    const status = document.getElementById("todo-status").value;

    if (!id || !title || !description || !status) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch(`/todo/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, status }),
      });

      if (response.ok) {
        await fetchTodos();
        // Clear input fields
        document.getElementById("todo-id").value = "";
        document.getElementById("todo-title").value = "";
        document.getElementById("todo-description").value = "";
        document.getElementById("todo-status").value = "progress";
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        alert("Failed to update todo.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while updating the todo.");
    }
    console.log("ID:", id);
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Status:", status);
  }

  async function deleteTodo(id) {
    try {
      const response = await fetch(`/todo/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTodos();
      } else {
        alert("Failed to delete todo.");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("An error occurred while deleting the todo.");
    }
  }

  function displayTodos(todos) {
    todoList.innerHTML = "";
    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.textContent = `${todo.title}: ${todo.description} [${todo.status}]`;

      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.onclick = function () {
        document.getElementById("todo-id").value = todo._id;
        document.getElementById("todo-title").value = todo.title;
        document.getElementById("todo-description").value = todo.description;
        document.getElementById("todo-status").value = todo.status;
      };

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = function () {
        deleteTodo(todo._id);
      };

      li.appendChild(editButton);
      li.appendChild(deleteButton);
      todoList.appendChild(li);
    });
  }

  document.getElementById("add-todo-btn").onclick = addTodo;
  document.getElementById("update-todo-btn").onclick = updateTodo;
  document.getElementById("get-data-btn").onclick = fetchTodos;
  document.getElementById("search-btn").onclick = async function () {
    const query = document.getElementById("search-query").value;
    const response = await fetch(`/todo/search?q=${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const todos = await response.json();
    displayTodos(todos);
  };

  document.getElementById("logout-btn").onclick = function () {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };

  fetchTodos();
});
