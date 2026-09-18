package com.kevin.lunaraspa.chatbot.model;

public record DocumentChunk(
        String source,
        String title,
        String content,
        double[] embedding
) {
    public DocumentChunk withEmbedding(double[] values) {
        return new DocumentChunk(source, title, content, values);
    }
}
