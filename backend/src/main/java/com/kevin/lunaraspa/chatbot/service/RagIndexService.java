package com.kevin.lunaraspa.chatbot.service;

import com.kevin.lunaraspa.chatbot.client.GeminiClient;
import com.kevin.lunaraspa.chatbot.model.DocumentChunk;
import com.kevin.lunaraspa.chatbot.model.SearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RagIndexService {

    private final DocumentCorpusService corpusService;
    private final GeminiClient geminiClient;
    private volatile List<DocumentChunk> index = List.of();

    public List<SearchResult> search(String query, int topK) {
        ensureIndexed();
        double[] queryEmbedding = geminiClient.embedQuery(query);
        return index.stream()
                .map(chunk -> new SearchResult(chunk, cosineSimilarity(queryEmbedding, chunk.embedding())))
                .sorted(Comparator.comparingDouble(SearchResult::score).reversed())
                .limit(topK)
                .toList();
    }

    private void ensureIndexed() {
        if (!index.isEmpty()) {
            return;
        }
        synchronized (this) {
            if (!index.isEmpty()) {
                return;
            }
            List<DocumentChunk> chunks = corpusService.loadChunks();
            List<double[]> embeddings = geminiClient.embedDocuments(chunks);
            List<DocumentChunk> indexed = new ArrayList<>(chunks.size());
            for (int position = 0; position < chunks.size(); position++) {
                indexed.add(chunks.get(position).withEmbedding(embeddings.get(position)));
            }
            index = List.copyOf(indexed);
        }
    }

    private double cosineSimilarity(double[] left, double[] right) {
        int dimensions = Math.min(left.length, right.length);
        double dot = 0;
        double leftNorm = 0;
        double rightNorm = 0;
        for (int index = 0; index < dimensions; index++) {
            dot += left[index] * right[index];
            leftNorm += left[index] * left[index];
            rightNorm += right[index] * right[index];
        }
        if (leftNorm == 0 || rightNorm == 0) {
            return 0;
        }
        return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
    }
}
