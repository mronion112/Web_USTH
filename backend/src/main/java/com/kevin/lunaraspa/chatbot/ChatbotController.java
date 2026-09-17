package com.kevin.lunaraspa.chatbot;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.kevin.lunaraspa.chatbot.dto.ChatRequest;
import com.kevin.lunaraspa.chatbot.dto.ChatResponse;
import com.kevin.lunaraspa.chatbot.service.ChatbotService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/chatbot")
@CrossOrigin(origins = "${app.frontend-url}")
@Tag(name = "RAG Chatbot", description = "Hỏi đáp dựa trên tài liệu spa trong thư mục docs bằng Gemini")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping(value = "/query", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Hỏi chatbot và nhận câu trả lời hoàn chỉnh")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trả lời thành công",
                    content = @Content(schema = @Schema(implementation = ChatResponse.class))),
            @ApiResponse(responseCode = "400", description = "Request không hợp lệ"),
            @ApiResponse(responseCode = "502", description = "Gemini API hoặc RAG index gặp lỗi")
    })
    public ResponseEntity<ChatResponse> query(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatbotService.ask(request));
    }

    @PostMapping(value = "/stream", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(
            summary = "Hỏi chatbot qua SSE streaming",
            description = "Event theo thứ tự: sources, nhiều token, done. Nếu lỗi sẽ có event error."
    )
    @ApiResponse(responseCode = "200", description = "SSE stream",
            content = @Content(mediaType = MediaType.TEXT_EVENT_STREAM_VALUE,
                    examples = @ExampleObject(value = "event:token\ndata:{\"text\":\"Amanoi \"}\n\nevent:done\ndata:{\"answer\":\"...\",\"sources\":[]}")))
    public SseEmitter stream(@Valid @RequestBody ChatRequest request) {
        return chatbotService.stream(request);
    }
}
