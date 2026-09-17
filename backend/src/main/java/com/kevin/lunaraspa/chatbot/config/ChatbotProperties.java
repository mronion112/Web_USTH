package com.kevin.lunaraspa.chatbot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.chatbot")
public class ChatbotProperties {
    private String geminiApiKey = "";
    private String generationModel = "gemini-2.5-flash";
    private String embeddingModel = "gemini-embedding-001";
    private String docsPath = "docs";
    private int chunkSize = 1600;
    private int chunkOverlap = 250;
    private int defaultTopK = 5;
}
