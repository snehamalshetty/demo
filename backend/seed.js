import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Announcement, Event, KnowledgeArticle, SupportTicket, User } from "./models/index.js";

if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in backend/.env before seeding.");
const password = process.env.DEMO_PASSWORD || "CampusDemo2026!";
await mongoose.connect(process.env.MONGODB_URI);
try {
  const demoUsers = [
    { name: "Campus Administrator", email: "admin@campus.demo", role: "admin" },
    { name: "Avery Faculty", email: "faculty@campus.demo", role: "faculty", department: "Student Services" },
    { name: "Jordan Student", email: "student@campus.demo", role: "student", department: "Computer Science", studentId: "CC-2026-001", year: "Second year" }
  ];
  const users = {};
  for (const item of demoUsers) {
    users[item.role] = await User.findOneAndUpdate(
      { email: item.email },
      { $setOnInsert: { ...item, password: await bcrypt.hash(password, 12) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const knowledge = [
    { title: "Library hours and access", category: "Library", summary: "Library services and opening hours", tags: ["library", "hours", "study"], content: "Fictional demo information: The Campus Learning Commons is open Monday to Friday, 8:00 AM–8:00 PM, and Saturday, 10:00 AM–4:00 PM. Contact the library desk for current holiday hours.", published: true, createdBy: users.admin.id },
    { title: "Requesting an enrollment letter", category: "Student Services", summary: "How to request an enrollment verification letter", tags: ["enrollment", "letter", "student services"], content: "Fictional demo information: Submit an enrollment letter request through the Student Services desk. Include your student ID and the purpose of the letter. Processing time and any requirements should be confirmed with Student Services.", published: true, createdBy: users.admin.id },
    { title: "Attendance policy contact", category: "Academics", summary: "Where to verify attendance requirements", tags: ["attendance", "academics"], content: "Fictional demo information: Attendance requirements differ by program and course. Check your course outline or contact your academic department to confirm the applicable policy. Campus Connect does not publish a universal attendance threshold.", published: true, createdBy: users.faculty.id },
    { title: "Technology help", category: "Technical", summary: "Request technical assistance", tags: ["technical", "support", "IT"], content: "Fictional demo information: For account, Wi-Fi, or learning-platform support, submit a Technical support ticket. Include the service name, a description of the issue, and any error message. Do not include your password.", published: true, createdBy: users.admin.id }
  ];
  for (const article of knowledge) await KnowledgeArticle.updateOne({ title: article.title }, { $setOnInsert: article }, { upsert: true });
  await Announcement.updateOne({ title: "Welcome to Campus Connect" }, { $setOnInsert: {
    title: "Welcome to Campus Connect", content: "Explore campus resources, ask verified questions, and connect with student services. This is fictional sample content for local development.",
    category: "General", priority: "important", audience: [], published: true, publishedAt: new Date(), createdBy: users.admin.id
  } }, { upsert: true });
  await Event.updateOne({ title: "Student Connections Meetup" }, { $setOnInsert: {
    title: "Student Connections Meetup", description: "A fictional demo event to help students meet campus clubs and services.",
    category: "Community", location: "Student Commons", startsAt: new Date(Date.now() + 14 * 86400000), capacity: 80, createdBy: users.admin.id
  } }, { upsert: true });
  await SupportTicket.updateOne({ title: "Demo: campus Wi-Fi access" }, { $setOnInsert: {
    title: "Demo: campus Wi-Fi access", description: "This sample ticket demonstrates how students can track a support request.",
    category: "Technical", priority: "normal", status: "open", student: users.student.id, assignedTo: users.faculty.id
  } }, { upsert: true });
  console.log(`Seed complete. Demo password: ${password}`);
} finally {
  await mongoose.disconnect();
}
