import React, { useState, useEffect } from "react";
import "./App.css";

/*
  Color Palette:
    -- Primary: #1976d2 (blue)
    -- Accent:  #ff9800 (orange)
    -- Secondary: #424242 (dark gray)
*/

// --- THEME CSS VARIABLES (inject at runtime as well as App.css for runtime override) ---
const lightThemeColors = {
  "--primary": "#1976d2",
  "--accent": "#ff9800",
  "--secondary": "#424242",
  "--bg": "#ffffff",
  "--bg-secondary": "#f5f6fa",
  "--surface": "#f8f9fa",
  "--text": "#212121",
  "--text-light": "#586069",
  "--border": "#e0e0e0",
  "--button-bg": "#1976d2",
  "--button-text": "#fff",
};
function applyThemeVars(vars) {
  for (const k in vars) {
    document.documentElement.style.setProperty(k, vars[k]);
  }
}

// --- API Config ---
const API_URL = "http://localhost:3001"; // CHANGE as appropriate to your backend base URL

// --- Helpers for API calls (with auth) ---
async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// --- AUTH UI/logic ---
function AuthForm({ onLogin, loading, error }) {
  // Simple Login/Register toggle
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    onLogin({ email, password, isLogin });
  }
  return (
    <div className="auth-box">
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <input
          className="input"
          required
          type="email"
          placeholder="Email"
          autoFocus
          value={email}
          aria-label="email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="input"
          required
          type="password"
          placeholder="Password"
          value={password}
          aria-label="password"
          onChange={e => setPassword(e.target.value)}
        />
        {error && (
          <div className="err" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
      <button
        className="btn-link"
        onClick={() => setIsLogin(x => !x)}
        style={{ marginTop: 8 }}
        type="button"
      >
        {isLogin ? "No account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}

// --- TASK FILTER/SORT SIDE MENU ---
function SideMenu(props) {
  return (
    <aside className="side-menu">
      <h3>Filters</h3>
      <div style={{ marginBottom: 16 }}>
        <label className="filter-label">
          <span>Status</span>
          <select
            value={props.status || ""}
            onChange={e => props.onFilterChange("status", e.target.value)}
          >
            <option value="">All</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="filter-label">
          <span>Sort By</span>
          <select
            value={props.sort || ""}
            onChange={e => props.onFilterChange("sort", e.target.value)}
          >
            <option value="">Created newest</option>
            <option value="oldest">Created oldest</option>
            <option value="alpha">Alphabetical</option>
            <option value="status">By Status</option>
          </select>
        </label>
      </div>
      <div>
        <button className="btn-link" onClick={props.onLogout}>Logout</button>
      </div>
    </aside>
  );
}

// --- SINGLE TASK CARD ---
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const statusMap = {
    todo: { label: "Todo", color: "#bdbdbd" },
    in_progress: { label: "In Progress", color: "#1976d2" },
    done: { label: "Done", color: "#ff9800" },
  };
  return (
    <div className="task-card">
      <div className="task-main">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-desc">{task.description}</div>
      </div>
      <div className="task-meta">
        <span
          className="task-status-label"
          style={{
            background: statusMap[task.status]?.color ?? "#ccc",
            color: "#fff",
          }}
        >
          {statusMap[task.status]?.label || task.status}
        </span>
        <span className="task-actions">
          <select
            className="input-compact"
            value={task.status}
            onChange={e => onStatusChange(task, e.target.value)}
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button className="btn-small" onClick={() => onEdit(task)}>Edit</button>
          <button
            className="btn-small btn-danger"
            onClick={() => onDelete(task)}
            aria-label="Delete Task"
            title="Delete Task"
          >
            &#x1F5D1;
          </button>
        </span>
      </div>
    </div>
  );
}

// --- TASK FORM MODAL (for create & edit) ---
function TaskFormModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status || "todo");
  // PUBLIC_INTERFACE
  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...initial,
      title: title.trim(),
      description: description.trim(),
      status,
    });
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{initial ? "Edit" : "New"} Task</h3>
        <form onSubmit={submit}>
          <label>
            <span>Title</span>
            <input
              className="input"
              required
              minLength={2}
              maxLength={100}
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              className="input"
              maxLength={500}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{resize:"vertical"}}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              className="input"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop: 6}}>
            <button className="btn-link" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- TASK LIST CONTENT ---
function TaskList({ tasks, onEdit, onDelete, onStatusChange }) {
  if (tasks.length === 0)
    return (
      <div className="task-empty">
        <p>No tasks found. <span role="img" aria-label="search">🔍</span></p>
      </div>
    );
  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  // Auth state
  const [user, setUser] = useState(() =>
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Filters/sort
  const [filters, setFilters] = useState({ status: "", sort: "" });

  // Theme handling
  useEffect(() => {
    applyThemeVars(lightThemeColors);
  }, []);

  // Fetch tasks when authed/filters change
  useEffect(() => {
    if (!token) return;
    setLoadingTasks(true);
    // Build API params
    let query = [];
    if (filters.status) query.push(`status=${filters.status}`);
    if (filters.sort) query.push(`sort=${filters.sort}`);
    let qstr = query.length ? "?" + query.join("&") : "";
    apiRequest(`/tasks${qstr}`, { token })
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoadingTasks(false));
  }, [token, filters]);

  // PUBLIC_INTERFACE
  async function handleAuth({ email, password, isLogin }) {
    setAuthError(null);
    setLoadingAuth(true);
    try {
      let payload;
      if (isLogin) {
        payload = await apiRequest("/auth/login", {
          method: "POST",
          body: { email, password },
        });
      } else {
        payload = await apiRequest("/auth/register", {
          method: "POST",
          body: { email, password },
        });
      }
      setUser(payload.user);
      setToken(payload.token);
      localStorage.setItem("user", JSON.stringify(payload.user));
      localStorage.setItem("token", payload.token);
    } catch (e) {
      setAuthError("" + e.message);
    } finally {
      setLoadingAuth(false);
    }
  }
  // PUBLIC_INTERFACE
  function handleLogout() {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setTasks([]);
  }

  // CRUD handlers
  function openNewTask() {
    setEditTask(null);
    setShowModal(true);
  }
  function openEditTask(task) {
    setEditTask(task);
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
    setEditTask(null);
  }

  // PUBLIC_INTERFACE
  async function saveTask(newOrEdit) {
    let resTask;
    try {
      if (newOrEdit.id) {
        // update
        resTask = await apiRequest(`/tasks/${newOrEdit.id}`, {
          method: "PUT",
          body: newOrEdit,
          token,
        });
        setTasks(tasks =>
          tasks.map(t => (t.id === resTask.id ? resTask : t))
        );
      } else {
        // create
        resTask = await apiRequest("/tasks", {
          method: "POST",
          body: newOrEdit,
          token,
        });
        setTasks(tasks => [...tasks, resTask]);
      }
      closeModal();
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  // PUBLIC_INTERFACE
  async function deleteTask(task) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: "DELETE",
        token,
      });
      setTasks(tasks => tasks.filter(t => t.id !== task.id));
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  }

  // PUBLIC_INTERFACE
  async function changeTaskStatus(task, status) {
    try {
      const resTask = await apiRequest(`/tasks/${task.id}`, {
        method: "PUT",
        body: { ...task, status },
        token,
      });
      setTasks(tasks => tasks.map(t => (t.id === task.id ? resTask : t)));
    } catch (e) {
      alert("Failed to update: " + e.message);
    }
  }

  // Handle filter/sort
  function handleFilterChange(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  // Filtering & UI rendering
  return (
    <div className="task-app-root">
      {/* --- HEADER --- */}
      <header className="navbar" style={{ background: lightThemeColors["--primary"] }}>
        <nav>
          <span className="navbar-brand">
            <span className="navbar-logo" />
            Task Tracker
          </span>
          {user && <span className="navbar-user">{user.email}</span>}
        </nav>
      </header>
      <div className="layout-main">
        {/* --- SIDE MENU (filters) --- */}
        {user && (
          <SideMenu
            status={filters.status}
            sort={filters.sort}
            onFilterChange={handleFilterChange}
            onLogout={handleLogout}
          />
        )}

        {/* --- MAIN CONTENT --- */}
        <main className="main-content">
          {!user ? (
            <AuthForm onLogin={handleAuth} loading={loadingAuth} error={authError} />
          ) : (
            <>
              <div className="main-header-row">
                <h2>Your Tasks</h2>
                <button className="btn-primary" onClick={openNewTask}>
                  + Add New
                </button>
              </div>
              {loadingTasks ? (
                <div className="loading tasks-loading">Loading tasks...</div>
              ) : (
                <TaskList
                  tasks={tasks}
                  onEdit={openEditTask}
                  onDelete={deleteTask}
                  onStatusChange={changeTaskStatus}
                />
              )}
            </>
          )}
        </main>
      </div>
      {/* Floating add button (shows only when logged in, on mobile) */}
      {user && (
        <button
          className="fab"
          aria-label="Add New Task"
          onClick={openNewTask}
        >
          +
        </button>
      )}
      {/* Modal for add/edit */}
      {showModal && (
        <TaskFormModal
          initial={editTask}
          onSave={saveTask}
          onClose={closeModal}
        />
      )}
      <footer className="footer">
        <span>
          Task Tracker &mdash; Minimal React Frontend &copy; {new Date().getFullYear()}
        </span>
      </footer>
      {/* Inline CSS styles to override any App.css defaults for minimalistic theme */}
      <style>{`
        .task-app-root {
          background: var(--bg, #fff);
          color: var(--text, #212121);
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }
        .navbar {
          height: 54px;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 0 var(--border, #e0e0e0);
        }
        .navbar nav {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          align-items: center;
        }
        .navbar-brand {
          font-size: 1.3rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.01em;
          display: flex;
          align-items:center;
        }
        .navbar-logo {
          display:inline-block;
          width:22px;
          height:22px;
          background: var(--accent, #ff9800);
          border-radius: 4px;
          margin-right:10px;
        }
        .navbar-user {
          font-size: 1rem;
          color: #fff;
          background:rgba(66,66,66,0.12);
          border-radius: 4px;
          padding: 4px 10px;
          margin-left:12px;
        }
        .footer {
          font-size:0.95rem;
          text-align:center;
          margin-top:48px;
          color:var(--text-light, #586069);
          padding: 10px 0 16px 0;
        }
        .layout-main {
          display:flex;
          width:100%;
          min-height: 85vh;
        }
        .side-menu {
          min-width: 200px;
          background:var(--surface, #f8f9fa);
          border-right:1px solid var(--border, #e0e0e0);
          padding:24px 14px 0 16px;
          height:calc(100vh - 54px);
        }
        .side-menu h3 {
          margin:0 0 22px 2px;
          font-size: 1.15rem;
          color: var(--primary, #1976d2);
        }
        .filter-label {
          display:block;
          font-size:1rem;
          margin-bottom:8px;
          color:var(--text, #212121);
        }
        .filter-label select {
          width:100%;
          margin-top:4px;
          padding:7px 10px;
          font-size:1rem;
          border-radius:5px;
          border:1px solid var(--border, #e0e0e0);
          background:var(--bg, #fff);
        }

        .main-content {
          flex:1;
          min-width:0;
          padding: 32px 22px 8px 22px;
          background: var(--bg, #ffffff);
        }
        .main-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          gap: 12px;
        }
        .main-header-row h2 {
          margin: 0;
          font-size: 1.3rem;
        }
        .task-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(295px, 1fr));
          gap: 20px;
        }
        .task-empty {
          padding:60px 0;
          color: #bdbdbd;
          font-size: 1.25rem;
        }
        .task-card {
          border:1px solid var(--border, #e0e0e0);
          background:var(--surface, #f8f9fa);
          border-radius: 10px;
          padding: 22px 18px 12px 18px;
          box-shadow: 0 1px 8px rgba(25, 118, 210, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .task-title {
          margin: 0 0 5px 0;
          font-weight: 600;
          font-size: 1.15rem;
          color: var(--primary, #1976d2);
        }
        .task-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
        }
        .task-status-label {
          display:inline-block;
          min-width:84px;
          border-radius: 20px;
          padding: 3px 14px;
          font-size: 0.98rem;
          font-weight:500;
          letter-spacing:0.03em;
          background: #eee;
          color:#222;
        }
        .task-actions {
          display: flex;
          gap: 6px;
          align-items:center;
        }
        .input,
        .input-compact {
          width: 100%;
          padding: 9px 12px;
          font-size: 1rem;
          border: 1px solid var(--border, #e0e0e0);
          border-radius: 5px;
          outline:none;
          margin: 2px 0 10px 0;
          box-sizing: border-box;
          background: var(--bg, #fff);
        }
        .input-compact {
          max-width: 100px;
          padding: 7px 10px;
          font-size: 0.96rem;
        }
        .btn-primary,
        .btn-small {
          background: var(--button-bg, #1976d2);
          color: var(--button-text, #fff);
          border: none;
          border-radius: 4px;
          padding: 9px 18px;
          font-size: 1rem;
          cursor: pointer;
          transition:background 0.2s;
          margin-right:6px;
        }
        .btn-primary:hover,
        .btn-small:hover {
          background: #1254a1;
        }
        .btn-small {
          font-size:0.98rem;
          padding:5px 12px;
          margin-right: 0;
        }
        .btn-danger {
          background: #fff2ee;
          color:#b71c1c;
          border:1px solid #b71c1c;
        }
        .btn-danger:hover {
          background:#ffbcb8;
        }
        .btn-link {
          color: var(--primary, #1976d2);
          background: none;
          border: none;
          font-size: 1rem;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          margin: 0;
        }
        .loading.tasks-loading {
          margin: 48px 0;
          color: #1976d2;
        }
        .auth-box {
          max-width:320px;
          margin:64px auto 0 auto;
          background:var(--surface, #f8f9fa);
          border-radius:10px;
          padding:36px 28px 26px 28px;
          box-shadow: 0 2px 16px rgba(25, 118, 210, 0.09);
        }
        .auth-box input {
          margin-bottom:10px;
        }
        .err {
          color: #b71c1c;
          margin-bottom:10px;
          font-size:0.99rem;
        }
        /* Floating Add Button */
        .fab {
          position: fixed;
          right: 30px;
          bottom: 42px;
          width: 54px;
          height:54px;
          border-radius: 100%;
          background: var(--accent, #ff9800);
          color:#fff;
          font-size:2.1rem;
          border: none;
          box-shadow:0 3px 16px rgba(25,118,210,0.18);
          cursor:pointer;
          display:none;
          z-index:1002;
        }
        @media (max-width:900px){
          .side-menu{display:none;}
          .main-content{padding-left:0;}
          .fab{display:block;}
        }
        @media (max-width:700px){
          .main-content{padding:11px 2px 2px 2px;}
          .main-header-row h2 { font-size: 1.05rem; }
          .task-card{padding:12px 8px;}
        }
        /* Modal styles */
        .modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(33,33,33,0.18);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal {
          min-width:330px;
          background:var(--bg,#fff);
          border-radius: 10px;
          box-shadow:0 3px 36px rgba(0,0,0,0.13);
          padding:32px 26px 18px 26px;
        }
        .modal h3 {
          margin-top: 0;
          font-size: 1.13rem;
        }
        .modal form label {
          font-size: 1rem;
          color: var(--text, #212121);
          margin-bottom: 5px;
          display: block;
        }
      `}</style>
    </div>
  );
}

export default App;
