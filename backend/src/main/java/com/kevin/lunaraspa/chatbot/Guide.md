# RAG Chatbot API

Module này trả lời câu hỏi dựa trên các file Markdown trong thư mục `docs` của repository.
Gemini được dùng cho hai bước:

1. `gemini-embedding-001` tạo embedding và tìm các đoạn tài liệu liên quan bằng cosine similarity.
2. `gemini-2.5-flash` sinh câu trả lời từ ngữ cảnh đã truy xuất.

Index được tạo trong bộ nhớ ở request đầu tiên và dùng lại cho đến khi backend khởi động lại.

## Cấu hình

```properties
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_GENERATION_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
CHATBOT_DOCS_PATH=docs
```

Khi chạy Docker, `docs` được copy vào `/app/docs` và Compose tự cấu hình `CHATBOT_DOCS_PATH=/app/docs`.

## Request chung

```json
{
  "message": "Amanoi có những dịch vụ spa nào?",
  "topK": 5
}
```

| Field | Bắt buộc | Quy tắc |
| --- | --- | --- |
| `message` | Có | Chuỗi không rỗng |
| `topK` | Không | Từ 1 đến 10; mặc định 5 |

Các API chatbot đang là public endpoint và không yêu cầu Bearer token.

## 1. Trả lời JSON hoàn chỉnh

```http
POST /api/v1/chatbot/query
Content-Type: application/json
```

Response `200 OK`:

```json
{
  "answer": "Amanoi cung cấp các liệu trình chăm sóc...",
  "sources": [
    {
      "source": "crawl/amanoi/services.md",
      "title": "Amanoi - Services",
      "score": 0.8421
    }
  ]
}
```

Ví dụ cURL:

```bash
curl -X POST http://localhost:8080/api/v1/chatbot/query \
  -H 'Content-Type: application/json' \
  -d '{"message":"Amanoi có những dịch vụ spa nào?","topK":5}'
```

## 2. SSE streaming

```http
POST /api/v1/chatbot/stream
Content-Type: application/json
Accept: text/event-stream
```

Thứ tự event:

```text
event: sources
data: [{"source":"crawl/amanoi/services.md","title":"Amanoi - Services","score":0.8421}]

event: token
data: {"text":"Amanoi "}

event: token
data: {"text":"cung cấp..."}

event: done
data: {"answer":"Amanoi cung cấp...","sources":[...]}
```

Nếu lỗi xảy ra sau khi kết nối SSE đã mở:

```text
event: error
data: {"message":"Nội dung lỗi"}
```

Ví dụ cURL:

```bash
curl -N -X POST http://localhost:8080/api/v1/chatbot/stream \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{"message":"So sánh chính sách của Amanoi và Anantara Hội An","topK":6}'
```

Vì native `EventSource` chỉ hỗ trợ GET, frontend nên dùng `fetch()` và đọc `response.body` để gọi SSE dạng POST.

## Error response trước khi stream mở

Validation error trả `400`. Lỗi Gemini, thiếu API key hoặc không tìm thấy docs trả `502`:

```json
{
  "success": false,
  "status": 502,
  "message": "Thiếu biến môi trường GEMINI_API_KEY.",
  "error": "CHATBOT_ERROR"
}
```

## Swagger

Mở:

```text
http://localhost:8080/swagger-ui/index.html
```

Hai endpoint nằm trong tag `RAG Chatbot`.
