import OpenAI from "openai";
import { KnowledgeArticle } from "../models/index.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function answerCampusQuestion(question) {
  const terms = question.toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  const uniqueTerms = [...new Set(terms)].slice(0, 8);
  const articles = uniqueTerms.length
    ? await KnowledgeArticle.find({
      published: true,
      $or: uniqueTerms.map((term) => ({
        $or: [
          { title: { $regex: escapeRegex(term), $options: "i" } },
          { summary: { $regex: escapeRegex(term), $options: "i" } },
          { content: { $regex: escapeRegex(term), $options: "i" } },
          { tags: { $regex: escapeRegex(term), $options: "i" } }
        ]
      }))
    }).limit(5).select("title content summary category").lean()
    : [];
  if (!articles.length) {
    return {
      content: "I couldn't verify that information in the campus knowledge base. Please contact the relevant campus department or submit a support ticket so the team can help.",
      sources: []
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      content: `Here is the verified information I found:\n\n${articles.map((item) => `**${item.title}**\n${item.summary || item.content}`).join("\n\n")}\n\nIf you need clarification, please contact the department listed in the article.`,
      sources: articles
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const context = articles.map((item) => `[${item.category}] ${item.title}\n${item.content}`).join("\n\n");
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are Campus Connect, a university information assistant. Answer only from the supplied campus knowledge. Do not infer or invent policies, fees, dates, locations, or contacts. If the context does not answer the question, say it cannot be verified and direct the student to contact the relevant department." },
        { role: "user", content: `Question: ${question}\n\nVerified campus knowledge:\n${context}` }
      ]
    });
    return { content: completion.choices[0]?.message?.content || "I couldn't generate a response. Please contact the relevant campus department.", sources: articles };
  } catch (error) {
    console.error("OpenAI request failed:", error.message);
    return {
      content: `The AI service is temporarily unavailable. Here is the verified information from the campus knowledge base:\n\n${articles.map((item) => `**${item.title}**\n${item.summary || item.content}`).join("\n\n")}`,
      sources: articles
    };
  }
}
