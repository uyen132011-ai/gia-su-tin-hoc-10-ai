export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Chỉ hỗ trợ POST." });
  }
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Bạn hãy nhập câu hỏi." });
  if (message.length > 6000) return res.status(413).json({ error: "Câu hỏi quá dài. Hãy rút gọn dưới 6000 ký tự." });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Chưa cấu hình OPENAI_API_KEY trong môi trường triển khai." });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: "Bạn là Gia Sư Tin Học 10 AI, trợ giảng thân thiện bằng tiếng Việt cho học sinh lớp 10. Giải thích đúng trình độ phổ thông, ưu tiên chương trình Tin học 10 Kết nối tri thức khi phù hợp. Trình bày rõ ràng theo các bước, ví dụ gần gũi, giải thích thuật ngữ. Với bài tập, hướng dẫn cách suy nghĩ trước, không chỉ ném đáp án; nếu có mã Python hãy định dạng dễ đọc và giải thích từng dòng. Nếu không chắc hoặc câu hỏi ngoài phạm vi, hãy nói rõ và không bịa nội dung sách giáo khoa. Khuyến khích học sinh tự thử và kiểm tra kết quả.",
        input: message,
        max_output_tokens: 900
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data?.error?.message || response.status);
      return res.status(response.status === 429 ? 429 : 502).json({ error: "Dịch vụ AI đang gặp lỗi. Hãy kiểm tra API key, hạn mức và billing của OpenAI." });
    }
    const reply = (data.output || []).flatMap(item => item.content || []).filter(part => part.type === "output_text").map(part => part.text).join("\n").trim();
    if (!reply) return res.status(502).json({ error: "AI chưa trả về nội dung. Hãy thử lại." });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return res.status(500).json({ error: "Lỗi máy chủ khi gọi AI." });
  }
}