package com.kevin.lunaraspa.chatbot.service;

import com.kevin.lunaraspa.chatbot.client.ChromaClient;
import com.kevin.lunaraspa.chatbot.client.GeminiClient;
import com.kevin.lunaraspa.chatbot.config.ChromaProperties;
import com.kevin.lunaraspa.chatbot.model.DocumentChunk;
import com.kevin.lunaraspa.chatbot.model.SearchResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RagIndexService {

    private static final Logger log = LoggerFactory.getLogger(RagIndexService.class);

    private final DocumentCorpusService corpusService;
    private final GeminiClient geminiClient;
    private final ChromaClient chromaClient;
    private final ChromaProperties chromaProperties;

    public List<SearchResult> search(String query, int topK) {
        double[] queryEmbedding = geminiClient.embedQuery(query);
        return chromaClient.query(queryEmbedding, topK).stream()
                .map(result -> new SearchResult(
                        new DocumentChunk(result.source(), result.title(), result.content(), null),
                        result.score()))
                .toList();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void indexOnStartup() {
        if (!chromaProperties.isStartupIndexing()) {
            log.info("Chroma startup indexing đang tắt.");
            return;
        }
        List<DocumentChunk> chunks = corpusService.loadChunks();
        chromaClient.ensureAvailable();
        List<double[]> embeddings = geminiClient.embedDocuments(chunks);
        List<ChromaClient.ChunkRecord> records = new ArrayList<>(chunks.size());
        Map<String, Integer> occurrences = new HashMap<>();
        Set<String> currentIds = new HashSet<>();
        for (int position = 0; position < chunks.size(); position++) {
            DocumentChunk chunk = chunks.get(position);
            String occurrenceKey = chunk.source() + "\n" + chunk.content();
            int occurrence = occurrences.merge(occurrenceKey, 1, Integer::sum) - 1;
            String id = stableId(chunk.source(), chunk.content(), occurrence);
            currentIds.add(id);
            records.add(new ChromaClient.ChunkRecord(id, chunk, embeddings.get(position)));
        }
        chromaClient.upsert(records);
        List<String> staleIds = chromaClient.getAllIds().stream()
                .filter(id -> !currentIds.contains(id))
                .toList();
        chromaClient.delete(staleIds);
        log.info("Đã đồng bộ {} chunks vào Chroma (xóa {} chunks cũ).", records.size(), staleIds.size());
    }

    private String stableId(String source, String content, int occurrence) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((source + "\n" + occurrence + "\n" + content)
                    .getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder("chunk-");
            for (byte value : hash) {
                result.append(String.format("%02x", value));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("JVM không hỗ trợ SHA-256.", exception);
        }
    }
}
