import React, { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../auth";
import SideMenu from "./SideMenu";
import TaskList from "./TaskList";
import TaskFormModal from "./TaskFormModal";

// PUBLIC_INTERFACE
export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({status:"", sort:""});

  // Fetch tasks
  useEffect(()=>{
    if(!token) return;
    setLoading(true);
    let query=[];
    if(filters.status) query.push(`status=${filters.status}`);
    if(filters.sort) query.push(`sort=${filters.sort}`);
    let qstr=query.length ? "?"+query.join("&") : "";
    apiRequest(`/tasks${qstr}`, {token})
      .then(setTasks)
      .finally(()=>setLoading(false));
  }, [token, filters]);

  function openNewTask() { setEditTask(null); setShowModal(true);}
  function openEditTask(task) { setEditTask(task); setShowModal(true);}
  function closeModal() { setShowModal(false); setEditTask(null);}
  async function saveTask(obj) {
    let newTask;
    try {
      if(obj.id) {
        newTask = await apiRequest(`/tasks/${obj.id}`, {method:"PUT",body:obj, token});
        setTasks(tasks=>tasks.map(t=>t.id===newTask.id ? newTask : t));
      } else {
        newTask = await apiRequest("/tasks", {method:"POST",body:obj, token});
        setTasks(tasks=>([...tasks, newTask]));
      }
      closeModal();
    } catch(e) { alert(e.message); }
  }
  async function deleteTask(task) {
    if(!window.confirm("Delete this task?")) return;
    await apiRequest(`/tasks/${task.id}`, {method:"DELETE", token});
    setTasks(tasks=>tasks.filter(t=>t.id!==task.id));
  }
  async function changeTaskStatus(task, status) {
    const nt = await apiRequest(`/tasks/${task.id}`, {
      method:"PUT", token, body:{ ...task, status }
    });
    setTasks(tasks=>tasks.map(t=>t.id===task.id ? nt : t));
  }
  function handleFilterChange(key, value) {
    setFilters(f=>({...f, [key]: value}));
  }

  return (
    <div className="task-app-root">
      <header className="navbar" style={{background: "#1976d2"}}>
        <nav>
          <span className="navbar-brand">
            <span className="navbar-logo" /> Task Tracker
          </span>
          <span className="navbar-user">{user.email}</span>
        </nav>
      </header>
      <div className="layout-main">
        <SideMenu
          status={filters.status}
          sort={filters.sort}
          onFilterChange={handleFilterChange}
          onLogout={logout}
        />
        <main className="main-content">
          <div className="main-header-row">
            <h2>Your Tasks</h2>
            <button className="btn-primary" onClick={openNewTask}>+ Add New</button>
          </div>
          {loading ? (
            <div className="loading tasks-loading">Loading tasks...</div>
          ) : (
            <TaskList
              tasks={tasks}
              onEdit={openEditTask}
              onDelete={deleteTask}
              onStatusChange={changeTaskStatus}
            />
          )}
        </main>
      </div>
      <button className="fab" aria-label="Add New Task" onClick={openNewTask}>+</button>
      {showModal && (
        <TaskFormModal
          initial={editTask}
          onSave={saveTask}
          onClose={closeModal}
        />
      )}
      <footer className="footer">
        <span>
          Task Tracker — Minimal React Frontend &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
