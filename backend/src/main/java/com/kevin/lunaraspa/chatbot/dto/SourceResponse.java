package com.kevin.lunaraspa.chatbot.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Nguồn tài liệu được RAG truy xuất")
public record SourceResponse(
        @Schema(example = "crawl/amanoi/services.md") String source,
        @Schema(example = "Amanoi - Services") String title,
        @Schema(example = "0.8421") double score
) {
}
