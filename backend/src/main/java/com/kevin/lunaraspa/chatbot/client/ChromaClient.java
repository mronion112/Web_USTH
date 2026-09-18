package com.kevin.lunaraspa.chatbot.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kevin.lunaraspa.chatbot.ChatbotException;
import com.kevin.lunaraspa.chatbot.config.ChromaProperties;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ChromaClient {

    private final ChromaProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private volatile String collectionId;

    public void ensureAvailable() {
        send("GET", "/api/v2/heartbeat", null);
    }

    public void ensureCollection() {
        if (collectionId != null) {
            return;
        }
        synchronized (this) {
            if (collectionId != null) {
                return;
            }

            String collectionPath = "/api/v2/tenants/%s/databases/%s/collections"
                    .formatted(segment(properties.getTenant()), segment(properties.getDatabase()));
            JsonNode existing = send("GET", collectionPath + "/" + segment(properties.getCollection()), null, false);
            if (existing != null && existing.hasNonNull("id")) {
                collectionId = existing.get("id").asText();
                return;
            }

            ObjectNode body = objectMapper.createObjectNode()
                    .put("name", properties.getCollection());
            body.putObject("metadata")
                    .put("description", "Lunara Spa RAG knowledge base");
            body.putObject("configuration")
                    .putObject("hnsw")
                    .put("space", "cosine");
            JsonNode created = send("POST", collectionPath, body);
            if (!created.hasNonNull("id")) {
                throw new ChatbotException("Chroma không trả về collection id.");
            }
            collectionId = created.get("id").asText();
        }
    }

    public void upsert(List<ChunkRecord> records) {
        ensureCollection();
        if (records.isEmpty()) {
            return;
        }
        String path = collectionPath() + "/upsert";
        int batchSize = Math.max(1, properties.getUpsertBatchSize());
        for (int start = 0; start < records.size(); start += batchSize) {
            int end = Math.min(start + batchSize, records.size());
            List<ChunkRecord> batch = records.subList(start, end);
            ObjectNode body = objectMapper.createObjectNode();
            ArrayNode ids = body.putArray("ids");
            ArrayNode embeddings = body.putArray("embeddings");
            ArrayNode documents = body.putArray("documents");
            ArrayNode metadatas = body.putArray("metadatas");
            for (ChunkRecord record : batch) {
                ids.add(record.id());
                ArrayNode embedding = embeddings.addArray();
                for (double value : record.embedding()) {
                    embedding.add(value);
                }
                documents.add(record.chunk().content());
                metadatas.addObject()
                        .put("source", record.chunk().source())
                        .put("title", record.chunk().title());
            }
            send("POST", path, body);
        }
    }

    public List<String> getAllIds() {
        ensureCollection();
        List<String> ids = new ArrayList<>();
        int offset = 0;
        int pageSize = 10_000;
        while (true) {
            ObjectNode body = objectMapper.createObjectNode()
                    .put("limit", pageSize)
                    .put("offset", offset);
            JsonNode response = send("POST", collectionPath() + "/get", body);
            ArrayNode page = (ArrayNode) response.path("ids");
            page.forEach(id -> ids.add(id.asText()));
            if (page.size() < pageSize) {
                return ids;
            }
            offset += page.size();
        }
    }

    public void delete(List<String> ids) {
        if (ids.isEmpty()) {
            return;
        }
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode values = body.putArray("ids");
        ids.forEach(values::add);
        send("POST", collectionPath() + "/delete", body);
    }

    public List<ChromaSearchResult> query(double[] embedding, int topK) {
        ensureCollection();
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode queryEmbeddings = body.putArray("query_embeddings");
        ArrayNode query = queryEmbeddings.addArray();
        for (double value : embedding) {
            query.add(value);
        }
        body.put("n_results", topK);
        ArrayNode include = body.putArray("include");
        include.add("documents").add("metadatas").add("distances");

        JsonNode response = send("POST", collectionPath() + "/query", body);
        ArrayNode ids = arrayAt(response.path("ids"), 0);
        ArrayNode documents = arrayAt(response.path("documents"), 0);
        ArrayNode metadatas = arrayAt(response.path("metadatas"), 0);
        ArrayNode distances = arrayAt(response.path("distances"), 0);
        List<ChromaSearchResult> results = new ArrayList<>(ids.size());
        for (int index = 0; index < ids.size(); index++) {
            Map<String, String> metadata = new HashMap<>();
            if (index < metadatas.size() && metadatas.get(index).isObject()) {
                metadatas.get(index).fields().forEachRemaining(entry -> metadata.put(entry.getKey(), entry.getValue().asText()));
            }
            String document = index < documents.size() && !documents.get(index).isNull()
                    ? documents.get(index).asText() : "";
            double distance = index < distances.size() ? distances.get(index).asDouble() : 1.0;
            results.add(new ChromaSearchResult(
                    ids.get(index).asText(),
                    metadata.getOrDefault("source", "unknown"),
                    metadata.getOrDefault("title", ""),
                    document,
                    Math.max(0.0, 1.0 - distance)));
        }
        return results;
    }

    private ArrayNode arrayAt(JsonNode node, int index) {
        return node.isArray() && node.size() > index && node.get(index).isArray()
                ? (ArrayNode) node.get(index) : objectMapper.createArrayNode();
    }

    private String collectionPath() {
        return "/api/v2/tenants/%s/databases/%s/collections/%s"
                .formatted(segment(properties.getTenant()), segment(properties.getDatabase()), segment(collectionId));
    }

    private String segment(String value) {
        return value.replace("%", "%25").replace("/", "%2F");
    }

    private JsonNode send(String method, String path, JsonNode body) {
        return send(method, path, body, true);
    }

    private JsonNode send(String method, String path, JsonNode body, boolean required) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(baseUrl() + path))
                .timeout(Duration.ofSeconds(120));
        if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
            builder.header("x-chroma-token", properties.getApiKey());
        }
        if (body == null) {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(toJson(body)));
        }
        try {
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404 && !required) {
                return null;
            }
            if (response.statusCode() / 100 != 2) {
                throw new ChatbotException("Chroma API lỗi HTTP " + response.statusCode() + ": " + response.body());
            }
            if (response.body().isBlank()) {
                return objectMapper.createObjectNode();
            }
            return objectMapper.readTree(response.body());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ChatbotException("Yêu cầu Chroma bị gián đoạn.", exception);
        } catch (IOException exception) {
            throw new ChatbotException("Không thể kết nối Chroma tại " + baseUrl(), exception);
        }
    }

    private String baseUrl() {
        return properties.getUrl().replaceAll("/+$", "");
    }

    private String toJson(JsonNode body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (IOException exception) {
            throw new ChatbotException("Không tạo được request Chroma.", exception);
        }
    }

    public record ChunkRecord(String id, DocumentChunk chunk, double[] embedding) {
    }

    public record ChromaSearchResult(
            String id,
            String source,
            String title,
            String content,
            double score
    ) {
    }
}
