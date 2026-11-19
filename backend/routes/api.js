import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "node:path";
import { body, validationResult } from "express-validator";
import { authenticate, allowRoles } from "../middleware/auth.js";
import {
  Announcement, ChatMessage, Conversation, Event, EventRegistration,
  KnowledgeArticle, SupportTicket, TicketReply, User
} from "../models/index.js";
import { answerCampusQuestion } from "../services/ai.js";

const router = Router();
const roles = ["student", "faculty", "admin"];
const pageOptions = (req) => ({
  page: Math.max(1, Number.parseInt(req.query.page, 10) || 1),
  limit: Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
});
const pagination = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) });
const cleanUser = (user) => {
  const value = user.toObject ? user.toObject() : user;
  delete value.password;
  return value;
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function sanitizeObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeObject);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) delete value[key];
      else value[key] = sanitizeObject(value[key]);
    }
  }
  return value;
}
function sanitizeIncoming(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  next();
}
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  next();
};
const issueToken = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const canManageContent = allowRoles("faculty", "admin");
const canManageAdmin = allowRoles("admin");
const upload = multer({
  dest: path.resolve("uploads"),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, callback) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    callback(allowed.includes(file.mimetype) ? null : new Error("Only PDF, JPEG, and PNG attachments are allowed."), allowed.includes(file.mimetype));
  }
});

router.use(sanitizeIncoming);

router.post("/auth/register", [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter your name."),
  body("email").isEmail().normalizeEmail().withMessage("Enter a valid email address."),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
], checkValidation, asyncRoute(async (req, res) => {
  const { name, email, password, department, studentId, year } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "An account with this email already exists." });
  const user = await User.create({
    name, email, password: await bcrypt.hash(password, 12), department, studentId, year, role: "student"
  });
  res.status(201).json({ token: issueToken(user), user: cleanUser(user) });
}));

router.post("/auth/login", [
  body("email").isEmail().normalizeEmail().withMessage("Enter a valid email address."),
  body("password").notEmpty().withMessage("Enter your password.")
], checkValidation, asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !user.active || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  res.json({ token: issueToken(user), user: cleanUser(user) });
}));

router.use(authenticate);
router.get("/auth/me", (req, res) => res.json({ user: cleanUser(req.user) }));
router.post("/auth/logout", (req, res) => res.json({ message: "Signed out." }));
router.put("/auth/profile", [
  body("name").optional().trim().isLength({ min: 2, max: 100 }),
  body("department").optional().trim().isLength({ max: 100 }),
  body("studentId").optional().trim().isLength({ max: 50 }),
  body("year").optional().trim().isLength({ max: 50 })
], checkValidation, asyncRoute(async (req, res) => {
  const fields = ["name", "department", "studentId", "year"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ user: cleanUser(req.user) });
}));
router.put("/auth/password", [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters.")
], checkValidation, asyncRoute(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!(await bcrypt.compare(req.body.currentPassword, user.password))) return res.status(400).json({ message: "Current password is incorrect." });
  user.password = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  res.json({ message: "Password updated." });
}));

router.get("/users", canManageAdmin, asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = {};
  if (roles.includes(req.query.role)) filter.role = req.query.role;
  if (req.query.search) filter.$or = [
    { name: { $regex: escapeRegex(String(req.query.search)), $options: "i" } },
    { email: { $regex: escapeRegex(String(req.query.search)), $options: "i" } }
  ];
  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ data: users, pagination: pagination(page, limit, total) });
}));
router.put("/users/:id", canManageAdmin, asyncRoute(async (req, res) => {
  const updates = {};
  for (const field of ["name", "role", "department", "studentId", "year", "active"]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.role && !roles.includes(updates.role)) return res.status(400).json({ message: "Invalid user role." });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user });
}));
router.delete("/users/:id", canManageAdmin, asyncRoute(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot deactivate your own account." });
  const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ message: "User deactivated." });
}));

router.get("/knowledge", asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = req.user.role === "admin" || req.user.role === "faculty" ? {} : { published: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$text = { $search: String(req.query.search) };
  const [data, total] = await Promise.all([
    KnowledgeArticle.find(filter).populate("createdBy", "name").sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    KnowledgeArticle.countDocuments(filter)
  ]);
  res.json({ data, pagination: pagination(page, limit, total) });
}));
router.get("/knowledge/:id", asyncRoute(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id).populate("createdBy", "name");
  if (!article || (!article.published && !["admin", "faculty"].includes(req.user.role))) return res.status(404).json({ message: "Article not found." });
  res.json({ article });
}));
router.post("/knowledge", canManageContent, asyncRoute(async (req, res) => {
  const article = await KnowledgeArticle.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ article });
}));
router.put("/knowledge/:id", canManageContent, asyncRoute(async (req, res) => {
  const updates = {};
  for (const field of ["title", "content", "summary", "category", "tags", "published"]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  const article = await KnowledgeArticle.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!article) return res.status(404).json({ message: "Article not found." });
  res.json({ article });
}));
router.delete("/knowledge/:id", canManageContent, asyncRoute(async (req, res) => {
  const result = await KnowledgeArticle.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ message: "Article not found." });
  res.json({ message: "Article deleted." });
}));

router.get("/announcements", asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = req.user.role === "admin" || req.user.role === "faculty"
    ? {} : { published: true, $or: [{ audience: { $size: 0 } }, { audience: req.user.role }] };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.title = { $regex: escapeRegex(String(req.query.search)), $options: "i" };
  const [data, total] = await Promise.all([
    Announcement.find(filter).populate("createdBy", "name").sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Announcement.countDocuments(filter)
  ]);
  res.json({ data, pagination: pagination(page, limit, total) });
}));
router.post("/announcements", canManageContent, asyncRoute(async (req, res) => {
  const values = { ...req.body, createdBy: req.user.id };
  if (values.published && !values.publishedAt) values.publishedAt = new Date();
  const announcement = await Announcement.create(values);
  res.status(201).json({ announcement });
}));
router.put("/announcements/:id", canManageContent, asyncRoute(async (req, res) => {
  const update = {};
  for (const field of ["title", "content", "category", "priority", "audience", "published"]) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }
  if (update.published === true && !update.publishedAt) update.publishedAt = new Date();
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!announcement) return res.status(404).json({ message: "Announcement not found." });
  res.json({ announcement });
}));
router.delete("/announcements/:id", canManageContent, asyncRoute(async (req, res) => {
  if (!await Announcement.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: "Announcement not found." });
  res.json({ message: "Announcement deleted." });
}));

router.get("/events", asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = {};
  if (req.query.upcoming === "true") filter.startsAt = { $gte: new Date() };
  if (req.query.upcoming === "false") filter.startsAt = { $lt: new Date() };
  if (req.query.search) filter.title = { $regex: escapeRegex(String(req.query.search)), $options: "i" };
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startsAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Event.countDocuments(filter)
  ]);
  const ids = events.map((event) => event._id);
  const [counts, mine] = await Promise.all([
    EventRegistration.aggregate([{ $match: { event: { $in: ids } } }, { $group: { _id: "$event", count: { $sum: 1 } } }]),
    EventRegistration.find({ event: { $in: ids }, user: req.user.id }).select("event").lean()
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  const mineSet = new Set(mine.map((row) => String(row.event)));
  res.json({ data: events.map((event) => ({ ...event, registrationCount: countMap.get(String(event._id)) || 0, registered: mineSet.has(String(event._id)) })), pagination: pagination(page, limit, total) });
}));
router.post("/events", canManageContent, asyncRoute(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ event });
}));
router.put("/events/:id", canManageContent, asyncRoute(async (req, res) => {
  const updates = {};
  for (const field of ["title", "description", "category", "location", "startsAt", "endsAt", "capacity"]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!event) return res.status(404).json({ message: "Event not found." });
  res.json({ event });
}));
router.delete("/events/:id", canManageContent, asyncRoute(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found." });
  await EventRegistration.deleteMany({ event: event.id });
  res.json({ message: "Event deleted." });
}));
router.post("/events/:id/register", asyncRoute(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (event.startsAt < new Date()) return res.status(400).json({ message: "Registration for this event has closed." });
  const count = await EventRegistration.countDocuments({ event: event.id });
  if (event.capacity && count >= event.capacity) return res.status(409).json({ message: "This event is full." });
  await EventRegistration.create({ event: event.id, user: req.user.id });
  res.status(201).json({ message: "You are registered for this event." });
}));
router.delete("/events/:id/register", asyncRoute(async (req, res) => {
  const result = await EventRegistration.findOneAndDelete({ event: req.params.id, user: req.user.id });
  if (!result) return res.status(404).json({ message: "You are not registered for this event." });
  res.json({ message: "Your registration was cancelled." });
}));

router.post("/tickets/upload", upload.array("attachments", 3), (req, res) => {
  res.status(201).json({ files: (req.files || []).map((file) => `/uploads/${file.filename}`) });
});
router.get("/tickets", asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = ["admin", "faculty"].includes(req.user.role) ? {} : { student: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.title = { $regex: String(req.query.search), $options: "i" };
  const [data, total] = await Promise.all([
    SupportTicket.find(filter).populate("student", "name email").populate("assignedTo", "name").sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    SupportTicket.countDocuments(filter)
  ]);
  res.json({ data, pagination: pagination(page, limit, total) });
}));
router.post("/tickets", [
  body("title").trim().isLength({ min: 3, max: 180 }),
  body("description").trim().isLength({ min: 10, max: 10000 })
], checkValidation, asyncRoute(async (req, res) => {
  const ticket = await SupportTicket.create({
    title: req.body.title, description: req.body.description,
    category: req.body.category, priority: req.body.priority,
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
    student: req.user.id
  });
  res.status(201).json({ ticket });
}));
router.get("/tickets/:id", asyncRoute(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate("student", "name email").populate("assignedTo", "name");
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  if (req.user.role === "student" && String(ticket.student.id) !== req.user.id) return res.status(403).json({ message: "You can only view your own tickets." });
  const repliesFilter = { ticket: ticket.id };
  if (req.user.role === "student") repliesFilter.internal = false;
  const replies = await TicketReply.find(repliesFilter).populate("author", "name role").sort({ createdAt: 1 });
  res.json({ ticket, replies });
}));
router.put("/tickets/:id", canManageContent, asyncRoute(async (req, res) => {
  const updates = {};
  for (const field of ["status", "priority", "assignedTo"]) if (req.body[field] !== undefined) updates[field] = req.body[field];
  if (updates.assignedTo) {
    const assignee = await User.findById(updates.assignedTo);
    if (!assignee || !["faculty", "admin"].includes(assignee.role) || !assignee.active) return res.status(400).json({ message: "Tickets can only be assigned to active faculty or admins." });
  }
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  res.json({ ticket });
}));
router.post("/tickets/:id/replies", [
  body("content").trim().isLength({ min: 1, max: 5000 }).withMessage("Reply cannot be empty.")
], checkValidation, asyncRoute(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  if (req.user.role === "student" && String(ticket.student) !== req.user.id) return res.status(403).json({ message: "You can only reply to your own tickets." });
  if (req.user.role === "student" && ticket.status === "closed") return res.status(400).json({ message: "Closed tickets cannot be reopened by reply." });
  const reply = await TicketReply.create({
    ticket: ticket.id, author: req.user.id, content: req.body.content,
    internal: ["admin", "faculty"].includes(req.user.role) && req.body.internal === true
  });
  if (req.user.role === "student" && ticket.status === "resolved") ticket.status = "open";
  await ticket.save();
  res.status(201).json({ reply });
}));

router.get("/chat/conversations", asyncRoute(async (req, res) => {
  const conversations = await Conversation.find({ user: req.user.id }).sort({ updatedAt: -1 }).limit(50);
  res.json({ data: conversations });
}));
router.post("/chat/conversations", asyncRoute(async (req, res) => {
  const conversation = await Conversation.create({ user: req.user.id, title: "New conversation" });
  res.status(201).json({ conversation });
}));
router.get("/chat/conversations/:id", asyncRoute(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user.id });
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });
  const messages = await ChatMessage.find({ conversation: conversation.id }).sort({ createdAt: 1 }).populate("sources", "title category");
  res.json({ conversation, messages });
}));
router.delete("/chat/conversations/:id", asyncRoute(async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });
  await ChatMessage.deleteMany({ conversation: conversation.id });
  res.json({ message: "Conversation deleted." });
}));
router.post("/chat", [
  body("message").trim().isLength({ min: 1, max: 4000 }).withMessage("Enter a question (up to 4,000 characters).")
], checkValidation, asyncRoute(async (req, res) => {
  let conversation = req.body.conversationId
    ? await Conversation.findOne({ _id: req.body.conversationId, user: req.user.id })
    : null;
  if (req.body.conversationId && !conversation) return res.status(404).json({ message: "Conversation not found." });
  if (!conversation) conversation = await Conversation.create({ user: req.user.id, title: req.body.message.slice(0, 80) });
  const answer = await answerCampusQuestion(req.body.message);
  const userMessage = await ChatMessage.create({ conversation: conversation.id, role: "user", content: req.body.message });
  const assistantMessage = await ChatMessage.create({
    conversation: conversation.id, role: "assistant", content: answer.content,
    sources: answer.sources.map((item) => item._id)
  });
  conversation.updatedAt = new Date();
  if (conversation.title === "New conversation") conversation.title = req.body.message.slice(0, 80);
  await conversation.save();
  res.json({ conversationId: conversation.id, userMessage, assistantMessage: { ...assistantMessage.toObject(), sources: answer.sources.map(({ _id, title, category }) => ({ _id, title, category })) } });
}));

router.get("/dashboard/student", asyncRoute(async (req, res) => {
  const [resourceCount, events, tickets, announcements, conversations] = await Promise.all([
    KnowledgeArticle.countDocuments({ published: true }),
    Event.find({ startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).limit(4),
    SupportTicket.find({ student: req.user.id }).sort({ updatedAt: -1 }).limit(4),
    Announcement.find({ published: true, $or: [{ audience: { $size: 0 } }, { audience: req.user.role }] }).sort({ publishedAt: -1 }).limit(4),
    Conversation.find({ user: req.user.id }).sort({ updatedAt: -1 }).limit(4)
  ]);
  res.json({
    stats: { resources: resourceCount, upcomingEvents: events.length, activeTickets: await SupportTicket.countDocuments({ student: req.user.id, status: { $in: ["open", "in-progress"] } }) },
    events, tickets, announcements, conversations
  });
}));
router.get("/dashboard/admin", canManageAdmin, asyncRoute(async (req, res) => {
  const [students, faculty, articles, announcements, events, ticketTotal, ticketsByStatus, categoryBreakdown, registrations] = await Promise.all([
    User.countDocuments({ role: "student", active: true }),
    User.countDocuments({ role: "faculty", active: true }),
    KnowledgeArticle.countDocuments(),
    Announcement.countDocuments(),
    Event.countDocuments(),
    SupportTicket.countDocuments(),
    SupportTicket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    KnowledgeArticle.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  res.json({
    stats: { students, faculty, articles, announcements, events, tickets: ticketTotal, openTickets: (ticketsByStatus.find((row) => row._id === "open")?.count || 0) + (ticketsByStatus.find((row) => row._id === "in-progress")?.count || 0), resolvedTickets: ticketsByStatus.find((row) => row._id === "resolved")?.count || 0 },
    charts: { ticketsByStatus, knowledgeByCategory: categoryBreakdown, registrations }
  });
}));

export default router;
