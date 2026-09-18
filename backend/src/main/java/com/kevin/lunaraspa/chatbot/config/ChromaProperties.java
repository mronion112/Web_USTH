package com.kevin.lunaraspa.chatbot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.chatbot.chroma")
public class ChromaProperties {

    private boolean enabled = false;
    private String url = "http://localhost:8000";
    private String tenant = "default_tenant";
    private String database = "default_database";
    private String collection = "lunara_spa_knowledge";
    private String apiKey = "";
    private boolean startupIndexing = true;
    private int upsertBatchSize = 100;
}
