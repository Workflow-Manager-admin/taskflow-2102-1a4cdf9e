import React from "react";

// PUBLIC_INTERFACE
export default function SideMenu({ status, sort, onFilterChange, onLogout }) {
  return (
    <aside className="side-menu">
      <h3>Filters</h3>
      <div style={{ marginBottom: 16 }}>
        <label className="filter-label">
          <span>Status</span>
          <select value={status || ""} onChange={e => onFilterChange("status", e.target.value)}>
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
          <select value={sort || ""} onChange={e=>onFilterChange("sort", e.target.value)}>
            <option value="">Created newest</option>
            <option value="oldest">Created oldest</option>
            <option value="alpha">Alphabetical</option>
            <option value="status">By Status</option>
          </select>
        </label>
      </div>
      <div>
        <button className="btn-link" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
}
