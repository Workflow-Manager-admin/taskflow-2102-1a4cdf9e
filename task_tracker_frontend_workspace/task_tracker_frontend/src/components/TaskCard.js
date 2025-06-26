import React from "react";

// PUBLIC_INTERFACE
export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
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
