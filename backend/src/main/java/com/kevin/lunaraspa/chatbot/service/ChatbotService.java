package com.kevin.lunaraspa.chatbot.service;

import com.kevin.lunaraspa.chatbot.ChatbotException;
import com.kevin.lunaraspa.chatbot.client.GeminiClient;
import com.kevin.lunaraspa.chatbot.config.ChatbotProperties;
import com.kevin.lunaraspa.chatbot.dto.ChatRequest;
import com.kevin.lunaraspa.chatbot.dto.ChatResponse;
import com.kevin.lunaraspa.chatbot.dto.ErrorEvent;
import com.kevin.lunaraspa.chatbot.dto.SourceResponse;
import com.kevin.lunaraspa.chatbot.dto.TokenEvent;
import com.kevin.lunaraspa.chatbot.model.SearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final long STREAM_TIMEOUT_MS = 180_000L;

    private final RagIndexService indexService;
    private final GeminiClient geminiClient;
    private final ChatbotProperties properties;

    public ChatResponse ask(ChatRequest request) {
        List<SearchResult> results = retrieve(request);
        List<SourceResponse> sources = sources(results);
        String answer = geminiClient.generate(prompt(request.message(), results));
        return new ChatResponse(answer, sources);
    }

    public SseEmitter stream(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        CompletableFuture.runAsync(() -> streamInternal(request, emitter));
        return emitter;
    }

    private void streamInternal(ChatRequest request, SseEmitter emitter) {
        try {
            List<SearchResult> results = retrieve(request);
            List<SourceResponse> sources = sources(results);
            emitter.send(SseEmitter.event().name("sources").data(sources));

            StringBuilder answer = new StringBuilder();
            geminiClient.stream(prompt(request.message(), results), token -> {
                answer.append(token);
                send(emitter, "token", new TokenEvent(token));
            });

            emitter.send(SseEmitter.event().name("done").data(new ChatResponse(answer.toString(), sources)));
            emitter.complete();
        } catch (Exception exception) {
            try {
                emitter.send(SseEmitter.event().name("error")
                        .data(new ErrorEvent(exception.getMessage() == null ? "Chatbot streaming thất bại." : exception.getMessage())));
            } catch (IOException ignored) {
                // Client disconnected; there is nothing left to send.
            }
            emitter.completeWithError(exception);
        }
    }

    private List<SearchResult> retrieve(ChatRequest request) {
        int topK = request.topK() == null ? properties.getDefaultTopK() : request.topK();
        return indexService.search(request.message(), topK);
    }

    private List<SourceResponse> sources(List<SearchResult> results) {
        return results.stream()
                .map(result -> new SourceResponse(
                        result.chunk().source(),
                        result.chunk().title(),
                        Math.round(result.score() * 10_000.0) / 10_000.0))
                .toList();
    }

    private String prompt(String question, List<SearchResult> results) {
        StringBuilder context = new StringBuilder("NGỮ CẢNH TỪ TÀI LIỆU:\n");
        for (int index = 0; index < results.size(); index++) {
            SearchResult result = results.get(index);
            context.append("\n[NGUỒN ").append(index + 1).append(": ")
                    .append(result.chunk().source()).append("]\n")
                    .append(result.chunk().content()).append('\n');
        }
        return context.append("\nCÂU HỎI: ").append(question)
                .append("\n\nHãy trả lời ngắn gọn, chính xác và nêu tên nguồn khi phù hợp.")
                .toString();
    }

    private void send(SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException exception) {
            throw new ChatbotException("Kết nối SSE đã đóng.", exception);
        }
    }
}
