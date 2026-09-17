package com.kevin.lunaraspa.chatbot.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Câu hỏi gửi tới chatbot RAG")
public record ChatRequest(
        @NotBlank
        @Schema(example = "Amanoi có những liệu trình spa nào?", requiredMode = Schema.RequiredMode.REQUIRED)
        String message,

        @Min(1) @Max(10)
        @Schema(example = "5", description = "Số đoạn tài liệu gần nhất được dùng làm ngữ cảnh")
        Integer topK
) {
}
