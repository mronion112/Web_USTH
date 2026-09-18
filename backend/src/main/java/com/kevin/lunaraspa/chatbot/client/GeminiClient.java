package com.kevin.lunaraspa.chatbot.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kevin.lunaraspa.chatbot.ChatbotException;
import com.kevin.lunaraspa.chatbot.config.ChatbotProperties;
import com.kevin.lunaraspa.chatbot.model.DocumentChunk;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class GeminiClient {

    private static final String API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final int EMBEDDING_DIMENSIONS = 768;
    private static final int EMBEDDING_BATCH_SIZE = 20;

    private final ChatbotProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public List<double[]> embedDocuments(List<DocumentChunk> chunks) {
        requireApiKey();
        List<double[]> embeddings = new ArrayList<>(chunks.size());
        for (int start = 0; start < chunks.size(); start += EMBEDDING_BATCH_SIZE) {
            int end = Math.min(start + EMBEDDING_BATCH_SIZE, chunks.size());
            embeddings.addAll(embedDocumentBatch(chunks.subList(start, end)));
        }
        return embeddings;
    }

    public double[] embedQuery(String query) {
        ObjectNode body = embedRequest(query, "QUESTION_ANSWERING", null);
        JsonNode response = sendJson("%s:embedContent".formatted(properties.getEmbeddingModel()), body);
        return values(response.path("embedding").path("values"));
    }

    public String generate(String prompt) {
        JsonNode response = sendJson("%s:generateContent".formatted(properties.getGenerationModel()), generationBody(prompt));
        String answer = extractText(response);
        if (answer.isBlank()) {
            throw new ChatbotException("Gemini không trả về nội dung.");
        }
        return answer;
    }

    public void stream(String prompt, Consumer<String> tokenConsumer) {
        requireApiKey();
        HttpRequest request = requestBuilder("%s:streamGenerateContent?alt=sse".formatted(properties.getGenerationModel()))
                .POST(HttpRequest.BodyPublishers.ofString(toJson(generationBody(prompt))))
                .build();
        try {
            HttpResponse<Stream<String>> response = httpClient.send(request, HttpResponse.BodyHandlers.ofLines());
            try (Stream<String> lines = response.body()) {
                if (response.statusCode() / 100 != 2) {
                    throw new ChatbotException("Gemini streaming lỗi HTTP " + response.statusCode() + ": " + String.join("", lines.toList()));
                }
                lines.filter(line -> line.startsWith("data:"))
                        .map(line -> line.substring(5).trim())
                        .filter(data -> !data.isBlank() && !"[DONE]".equals(data))
                        .map(this::parseJson)
                        .map(this::extractText)
                        .filter(text -> !text.isBlank())
                        .forEach(tokenConsumer);
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ChatbotException("Gemini streaming bị gián đoạn.", exception);
        } catch (IOException exception) {
            throw new ChatbotException("Không thể kết nối Gemini streaming.", exception);
        }
    }

    private List<double[]> embedDocumentBatch(List<DocumentChunk> chunks) {
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode requests = body.putArray("requests");
        for (DocumentChunk chunk : chunks) {
            ObjectNode item = embedRequest(chunk.content(), "RETRIEVAL_DOCUMENT", chunk.title());
            item.put("model", "models/" + properties.getEmbeddingModel());
            requests.add(item);
        }
        JsonNode response = sendJson("%s:batchEmbedContents".formatted(properties.getEmbeddingModel()), body);
        ArrayNode nodes = (ArrayNode) response.path("embeddings");
        if (nodes.size() != chunks.size()) {
            throw new ChatbotException("Gemini trả sai số lượng embeddings.");
        }
        List<double[]> result = new ArrayList<>(nodes.size());
        nodes.forEach(node -> result.add(values(node.path("values"))));
        return result;
    }

    private ObjectNode embedRequest(String text, String taskType, String title) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("taskType", taskType);
        body.put("outputDimensionality", EMBEDDING_DIMENSIONS);
        if (title != null && !title.isBlank()) {
            body.put("title", title);
        }
        body.putObject("content").putArray("parts").addObject().put("text", text);
        return body;
    }

    private ObjectNode generationBody(String prompt) {
        ObjectNode body = objectMapper.createObjectNode();
        body.putObject("systemInstruction").putArray("parts").addObject().put("text",
                "Bạn là trợ lý tư vấn spa. Chỉ trả lời bằng thông tin có trong ngữ cảnh RAG được cung cấp. " +
                "Nếu ngữ cảnh không đủ, hãy nói rõ rằng tài liệu hiện có không chứa câu trả lời. " +
                "Không tự bịa giá, dịch vụ, chính sách hoặc thời gian hoạt động. Trả lời bằng ngôn ngữ của người dùng.");
        body.putArray("contents").addObject()
                .put("role", "user")
                .putArray("parts").addObject().put("text", prompt);
        body.putObject("generationConfig")
                .put("temperature", 0.2)
                .put("maxOutputTokens", 1200);
        return body;
    }

    private JsonNode sendJson(String endpoint, JsonNode body) {
        requireApiKey();
        HttpRequest request = requestBuilder(endpoint)
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(toJson(body)))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                throw new ChatbotException("Gemini API lỗi HTTP " + response.statusCode() + ": " + response.body());
            }
            return parseJson(response.body());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ChatbotException("Yêu cầu Gemini bị gián đoạn.", exception);
        } catch (IOException exception) {
            throw new ChatbotException("Không thể kết nối Gemini API.", exception);
        }
    }

    private HttpRequest.Builder requestBuilder(String endpoint) {
        return HttpRequest.newBuilder(URI.create(API_BASE + endpoint))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", properties.getGeminiApiKey());
    }

    private String extractText(JsonNode response) {
        StringBuilder text = new StringBuilder();
        response.path("candidates").forEach(candidate ->
                candidate.path("content").path("parts").forEach(part -> {
                    if (part.hasNonNull("text")) {
                        text.append(part.get("text").asText());
                    }
                }));
        return text.toString();
    }

    private double[] values(JsonNode values) {
        if (!values.isArray() || values.isEmpty()) {
            throw new ChatbotException("Gemini không trả về embedding hợp lệ.");
        }
        double[] result = new double[values.size()];
        for (int index = 0; index < values.size(); index++) {
            result[index] = values.get(index).asDouble();
        }
        return result;
    }

    private JsonNode parseJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (IOException exception) {
            throw new ChatbotException("Không đọc được phản hồi JSON từ Gemini.", exception);
        }
    }

    private String toJson(JsonNode body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (IOException exception) {
            throw new ChatbotException("Không tạo được request Gemini.", exception);
        }
    }

    private void requireApiKey() {
        if (properties.getGeminiApiKey() == null || properties.getGeminiApiKey().isBlank()) {
            throw new ChatbotException("Thiếu biến môi trường GEMINI_API_KEY.");
        }
    }
}
