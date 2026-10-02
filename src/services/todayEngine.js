import { getDueState, TASK_STATUS } from "../data/lifeModel";
import { getDomain } from "../data/lifeDomains";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTask(task, source = "general") {
  if (!task || typeof task !== "object") return null;
  const title = String(task.title ?? task.desc ?? task.description ?? "").trim();
  if (!title) return null;
  const dueDate = String(task.dueDate ?? task.due ?? "").slice(0, 10);
  const status = task.status === "Done" || task.status === TASK_STATUS.DONE ? TASK_STATUS.DONE : (task.status || TASK_STATUS.TODO);
  return {
    id: String(task.id ?? `${source}-${title}`),
    title,
    domain: task.domain || source,
    source,
    priority: task.priority || task.pri || "medium",
    status,
    dueDate: ISO_DATE.test(dueDate) ? dueDate : "",
    notes: String(task.notes ?? ""),
  };
}

export function buildTodaySnapshot({
  today = localDateKey(),
  tasks = [],
  goals = [],
  paths = [],
} = {}) {
  const normalized = tasks.map((task) => normalizeTask(task, task?.domain || "general")).filter(Boolean);
  const actionable = normalized.filter((task) => task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.ARCHIVED);
  const overdue = actionable.filter((task) => getDueState(task, today) === "overdue");
  const dueToday = actionable.filter((task) => getDueState(task, today) === "today");
  const upcoming = actionable.filter((task) => getDueState(task, today) === "upcoming");
  const highPriority = actionable.filter((task) => ["high", "P1", "urgent"].includes(String(task.priority).toLowerCase()));

  const activeGoals = goals.filter((goal) => goal && (goal.status || "active") === "active");
  const activePaths = paths.filter((path) => path && ["active", "candidate"].includes(path.status || "candidate"));

  const score = normalized.length
    ? Math.round((normalized.filter((task) => task.status === TASK_STATUS.DONE).length / normalized.length) * 100)
    : 0;

  const rank = (task) => {
    const due = getDueState(task, today);
    const priority = String(task.priority).toLowerCase();
    return (due === "overdue" ? 100 : due === "today" ? 80 : 0) + (priority === "high" || priority === "p1" ? 30 : priority === "medium" ? 10 : 0);
  };

  const topActions = [...actionable].sort((a, b) => rank(b) - rank(a)).slice(0, 7);

  return {
    today,
    overdue,
    dueToday,
    upcoming,
    highPriority,
    topActions,
    activeGoals,
    activePaths,
    completionPercent: score,
    totalTasks: normalized.length,
    openTasks: actionable.length,
    domainSummary: Object.values(
      normalized.reduce((acc, task) => {
        const domain = task.domain || "general";
        if (!acc[domain]) acc[domain] = { ...getDomain(domain), open: 0, overdue: 0, today: 0 };
        if (task.status !== TASK_STATUS.DONE) acc[domain].open += 1;
        const due = getDueState(task, today);
        if (due === "overdue") acc[domain].overdue += 1;
        if (due === "today") acc[domain].today += 1;
        return acc;
      }, {})
    ),
  };
}
