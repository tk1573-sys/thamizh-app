// Stable, domain-neutral model used by the future Command Centre.
// Existing module-specific data can migrate into these records incrementally.

export const LIFE_SCHEMA_VERSION = 1;

export const GOAL_STATUS = Object.freeze({ ACTIVE: "active", PAUSED: "paused", COMPLETED: "completed", ARCHIVED: "archived" });
export const TASK_STATUS = Object.freeze({ TODO: "todo", IN_PROGRESS: "in-progress", DONE: "done", ARCHIVED: "archived" });
export const PRIORITY = Object.freeze({ HIGH: "high", MEDIUM: "medium", LOW: "low" });

export function createGoal(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || crypto.randomUUID(),
    title: overrides.title || "",
    domain: overrides.domain || "general",
    pathId: overrides.pathId || null,
    why: overrides.why || "",
    priority: overrides.priority || PRIORITY.MEDIUM,
    status: overrides.status || GOAL_STATUS.ACTIVE,
    startDate: overrides.startDate || now.slice(0, 10),
    targetDate: overrides.targetDate || "",
    description: overrides.description || "",
    createdAt: overrides.createdAt || now,
    updatedAt: now,
  };
}

export function createTask(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || crypto.randomUUID(),
    title: overrides.title || "",
    domain: overrides.domain || "general",
    goalId: overrides.goalId || null,
    pathId: overrides.pathId || null,
    priority: overrides.priority || PRIORITY.MEDIUM,
    status: overrides.status || TASK_STATUS.TODO,
    dueDate: overrides.dueDate || "",
    notes: overrides.notes || "",
    createdAt: overrides.createdAt || now,
    updatedAt: now,
  };
}

export function createPath(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || crypto.randomUUID(),
    name: overrides.name || "",
    status: overrides.status || "candidate",
    reason: overrides.reason || "",
    startDate: overrides.startDate || "",
    targetDate: overrides.targetDate || "",
    createdAt: overrides.createdAt || now,
    updatedAt: now,
  };
}

export function getDueState(task, today = new Date().toISOString().slice(0, 10)) {
  if (!task?.dueDate || task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.ARCHIVED) return "none";
  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "today";
  return "upcoming";
}
