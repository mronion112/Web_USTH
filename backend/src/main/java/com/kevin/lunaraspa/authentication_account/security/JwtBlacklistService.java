package com.kevin.lunaraspa.authentication_account.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class JwtBlacklistService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtUtils jwtUtils;

    public void blacklistToken(String token) {
        long expirationTime = jwtUtils.extractExpiration(token).getTime();
        long ttl = expirationTime - System.currentTimeMillis();
        if (ttl > 0) {
            redisTemplate.opsForValue().set(getRedisKey(token), "blacklisted", Duration.ofMillis(ttl));
        }
    }

    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(getRedisKey(token)));
    }

    private String getRedisKey(String token) {
        return "blacklist:" + token;
    }
}
