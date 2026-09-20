package com.kevin.lunaraspa.realtime;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class SseEventHub {
    private static final List<String> OPERATIONS = List.of("OWNER", "MANAGER", "RECEPTIONIST");
    private final List<Client> clients = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(Long accountId, String role) {
        SseEmitter emitter = new SseEmitter(0L);
        Client client = new Client(accountId, normalizeRole(role), emitter);
        clients.add(client);
        emitter.onCompletion(() -> clients.remove(client));
        emitter.onTimeout(() -> clients.remove(client));
        emitter.onError(error -> clients.remove(client));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ready"));
        } catch (IOException error) {
            clients.remove(client);
        }
        return emitter;
    }

    public void broadcast(RealtimeEventEnvelope envelope) {
        for (Client client : clients) {
            if (!mayReceive(client, envelope)) continue;
            try {
                client.emitter().send(SseEmitter.event().id(envelope.id()).name("refresh").data(envelope));
            } catch (IOException | IllegalStateException error) {
                clients.remove(client);
            }
        }
    }

    @Scheduled(fixedRate = 25_000)
    void heartbeat() {
        for (Client client : clients) {
            try {
                client.emitter().send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException | IllegalStateException error) {
                clients.remove(client);
            }
        }
    }

    private boolean mayReceive(Client client, RealtimeEventEnvelope event) {
        if ("CUSTOMER".equals(client.role())) return client.accountId().equals(event.customerAccountId());
        if ("THERAPIST".equals(client.role())) return client.accountId().equals(event.staffAccountId());
        if ("ACCOUNTANT".equals(client.role())) return "payment".equals(event.topic());
        return OPERATIONS.contains(client.role());
    }

    private String normalizeRole(String role) {
        if (role == null) return "";
        return role.startsWith("ROLE_") ? role.substring(5) : role;
    }

    private record Client(Long accountId, String role, SseEmitter emitter) {
    }
}
