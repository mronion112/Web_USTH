package com.kevin.lunaraspa.chatbot.service;

import com.kevin.lunaraspa.chatbot.ChatbotException;
import com.kevin.lunaraspa.chatbot.config.ChatbotProperties;
import com.kevin.lunaraspa.chatbot.model.DocumentChunk;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DocumentCorpusService {

    private final ChatbotProperties properties;

    public List<DocumentChunk> loadChunks() {
        Path docsRoot = resolveDocsRoot();
        try (Stream<Path> paths = Files.walk(docsRoot)) {
            List<DocumentChunk> chunks = new ArrayList<>();
            paths.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".md"))
                    .sorted()
                    .forEach(path -> chunks.addAll(readChunks(docsRoot, path)));
            if (chunks.isEmpty()) {
                throw new ChatbotException("Không tìm thấy tài liệu Markdown trong " + docsRoot.toAbsolutePath());
            }
            return chunks;
        } catch (IOException exception) {
            throw new ChatbotException("Không đọc được thư mục tài liệu " + docsRoot.toAbsolutePath(), exception);
        }
    }

    private List<DocumentChunk> readChunks(Path root, Path file) {
        try {
            String markdown = Files.readString(file, StandardCharsets.UTF_8).trim();
            String title = markdown.lines()
                    .filter(line -> line.startsWith("#"))
                    .map(line -> line.replaceFirst("^#+\\s*", "").trim())
                    .findFirst()
                    .orElse(file.getFileName().toString().replace(".md", ""));
            String source = root.relativize(file).toString().replace('\\', '/');
            return split(markdown).stream()
                    .map(content -> new DocumentChunk(source, title, content, null))
                    .toList();
        } catch (IOException exception) {
            throw new ChatbotException("Không đọc được tài liệu " + file, exception);
        }
    }

    private List<String> split(String markdown) {
        int maxSize = Math.max(400, properties.getChunkSize());
        int overlap = Math.min(Math.max(0, properties.getChunkOverlap()), maxSize / 3);
        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String paragraph : markdown.split("\\R\\s*\\R")) {
            String clean = paragraph.trim();
            if (clean.isEmpty()) {
                continue;
            }
            if (clean.length() > maxSize) {
                flush(chunks, current);
                for (int start = 0; start < clean.length(); start += maxSize - overlap) {
                    chunks.add(clean.substring(start, Math.min(start + maxSize, clean.length())));
                }
                continue;
            }
            if (!current.isEmpty() && current.length() + clean.length() + 2 > maxSize) {
                String previous = current.toString();
                chunks.add(previous);
                current.setLength(0);
                if (overlap > 0) {
                    current.append(previous.substring(Math.max(0, previous.length() - overlap)).trim());
                }
            }
            if (!current.isEmpty()) {
                current.append("\n\n");
            }
            current.append(clean);
        }
        flush(chunks, current);
        return chunks;
    }

    private void flush(List<String> chunks, StringBuilder current) {
        if (!current.isEmpty()) {
            chunks.add(current.toString());
            current.setLength(0);
        }
    }

    private Path resolveDocsRoot() {
        List<Path> candidates = List.of(
                Path.of(properties.getDocsPath()),
                Path.of("docs"),
                Path.of("..", "docs")
        );
        return candidates.stream()
                .map(Path::normalize)
                .filter(Files::isDirectory)
                .findFirst()
                .orElseThrow(() -> new ChatbotException(
                        "Không tìm thấy thư mục docs. Hãy cấu hình CHATBOT_DOCS_PATH."));
    }
}
