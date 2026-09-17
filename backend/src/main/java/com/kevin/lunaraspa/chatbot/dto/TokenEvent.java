package com.kevin.lunaraspa.chatbot.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Một phần nội dung trong stream")
public record TokenEvent(@Schema(example = "Amanoi ") String text) {
}
