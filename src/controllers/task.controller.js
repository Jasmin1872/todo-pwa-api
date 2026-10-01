import Task from "../models/Task.js";
const allowed = ["Pendiente", "En Progreso", "Completada"];

export async function list(req, res) {
  const items = await Task.find({ user: req.userId, deleted: false }).sort({ createdAt: -1 });
  // puedes dejar {items} si ya tienes el front normalizando
  res.json({ items });
}

export async function create(req, res) {
  const { title, description = "", status = "Pendiente", clienteId } = req.body;
  if (!title) return res.status(400).json({ message: "El título es requerido" });

  const task = await Task.create({
    user: req.userId,
    title,
    description,
    status: allowed.includes(status) ? status : "Pendiente",
    clienteId,
  });

  res.status(201).json({ task });
}

export async function update(req, res) {
  const { id } = req.params;
  let { title, description, status, completed } = req.body;

  // Soporta front que manda completed:boolean
  if (typeof completed === "boolean") {
    status = completed ? "Completada" : "Pendiente";
  }

  if (status && !allowed.includes(status)) {
    return res.status(400).json({ message: "Estado inválido" });
  }

  const set = {};
  if (typeof title === "string") set.title = title.trim();
  if (typeof description === "string") set.description = description.trim();
  if (status) set.status = status;

  const task = await Task.findOneAndUpdate(
    { _id: id, user: req.userId },
    { $set: set },
    { new: true }
  );

  if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
  res.json({ task });
}

export async function remove(req, res) {
  const { id } = req.params;
  const task = await Task.findOneAndUpdate(
    { _id: id, user: req.userId },
    { deleted: true },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
  res.json({ ok: true });
}

/** Sincronización offline */
export async function bulksync(req, res) {
  const { tasks = [] } = req.body;
  const mapping = [];

  for (const t of tasks) {
    if (!t?.clienteId || !t?.title) continue;

    let doc = await Task.findOne({ user: req.userId, clienteId: t.clienteId });
    if (!doc) {
      doc = await Task.create({
        user: req.userId,
        title: t.title,
        description: t.description ?? "",
        status: allowed.includes(t.status) ? t.status : "Pendiente",
        clienteId: t.clienteId,
      });
    } else {
      doc.title = t.title ?? doc.title;
      doc.description = t.description ?? doc.description;
      if (t.status && allowed.includes(t.status)) doc.status = t.status;
      await doc.save();
    }

    mapping.push({ clienteId: t.clienteId, serverId: String(doc._id) });
  }

  res.json({ mapping });
}