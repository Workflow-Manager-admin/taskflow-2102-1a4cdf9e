import React from "react";
import TaskCard from "./TaskCard";

// PUBLIC_INTERFACE
export default function TaskList({ tasks, onEdit, onDelete, onStatusChange }) {
  if (!tasks.length)
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
