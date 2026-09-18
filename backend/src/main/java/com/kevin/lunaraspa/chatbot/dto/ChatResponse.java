package com.kevin.lunaraspa.chatbot.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Câu trả lời hoàn chỉnh của chatbot RAG")
public record ChatResponse(
        @Schema(example = "Amanoi cung cấp các liệu trình...") String answer,
        List<SourceResponse> sources
) {
}
