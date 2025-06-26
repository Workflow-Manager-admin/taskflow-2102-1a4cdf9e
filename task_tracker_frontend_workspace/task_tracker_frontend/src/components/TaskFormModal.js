import React, { useState } from "react";

// PUBLIC_INTERFACE
export default function TaskFormModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status || "todo");

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
              style={{ resize: "vertical" }}
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
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
