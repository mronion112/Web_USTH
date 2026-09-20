package com.kevin.lunaraspa.realtime;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.AuthErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
public class RealtimeEventController {
    private final SseEventHub hub;
    private final AccountRepository accountRepository;

    @GetMapping(path = "/api/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        Account account = accountRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .filter(item -> Boolean.TRUE.equals(item.getIsActive()))
                .orElseThrow(() -> new AppException(AuthErrorCode.ACCOUNT_NOT_FOUND));
        return hub.subscribe(account.getId(), account.getRole().getCode());
    }
}
