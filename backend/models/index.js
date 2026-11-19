import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ["student", "faculty", "admin"], default: "student", index: true },
  department: { type: String, trim: true, default: "" },
  studentId: { type: String, trim: true, default: "" },
  year: { type: String, trim: true, default: "" },
  avatar: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const knowledgeSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  content: { type: String, required: true, maxlength: 20000 },
  summary: { type: String, default: "", maxlength: 500 },
  category: { type: String, required: true, index: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  published: { type: Boolean, default: false, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
knowledgeSchema.index({ title: "text", content: "text", summary: "text", tags: "text" });

const announcementSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  content: { type: String, required: true, maxlength: 10000 },
  category: { type: String, default: "General" },
  priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
  audience: [{ type: String, enum: ["student", "faculty", "admin"] }],
  published: { type: Boolean, default: false, index: true },
  publishedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const eventSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, maxlength: 10000 },
  category: { type: String, default: "Campus" },
  location: { type: String, required: true, trim: true },
  startsAt: { type: Date, required: true, index: true },
  endsAt: Date,
  capacity: { type: Number, min: 1, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const eventRegistrationSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

const ticketSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, maxlength: 10000 },
  category: { type: String, enum: ["Academic", "Technical", "Fees", "Hostel", "Examination", "Library", "Administration", "Other"], default: "Other" },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
  status: { type: String, enum: ["open", "in-progress", "resolved", "closed"], default: "open", index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
  attachments: [{ type: String }]
}, { timestamps: true });

const ticketReplySchema = new Schema({
  ticket: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxlength: 5000 },
  internal: { type: Boolean, default: false }
}, { timestamps: true });

const conversationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "New conversation", maxlength: 100 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const chatMessageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true, maxlength: 10000 },
  sources: [{ type: Schema.Types.ObjectId, ref: "KnowledgeArticle" }]
}, { timestamps: true });

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readAt: Date,
  link: String
}, { timestamps: true });

export const User = model("User", userSchema);
export const KnowledgeArticle = model("KnowledgeArticle", knowledgeSchema);
export const Announcement = model("Announcement", announcementSchema);
export const Event = model("Event", eventSchema);
export const EventRegistration = model("EventRegistration", eventRegistrationSchema);
export const SupportTicket = model("SupportTicket", ticketSchema);
export const TicketReply = model("TicketReply", ticketReplySchema);
export const Conversation = model("Conversation", conversationSchema);
export const ChatMessage = model("ChatMessage", chatMessageSchema);
export const Notification = model("Notification", notificationSchema);
