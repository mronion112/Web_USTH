package com.kevin.lunaraspa.profiles.dto;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.ProfileErrorCode;
import java.util.Map;
import java.util.Set;
import lombok.Getter;

@Getter
public class ProfileUpdateRequest {
    private String displayName;
    private String phone;
    private String preferences;
    private boolean displayNamePresent;
    private boolean phonePresent;
    private boolean preferencesPresent;

    public void setDisplayName(String value) { displayName = value; displayNamePresent = true; }
    public void setPhone(String value) { phone = value; phonePresent = true; }
    public void setPreferences(String value) { preferences = value; preferencesPresent = true; }

    public static ProfileUpdateRequest from(Map<String, Object> body) {
        if (body == null || body.isEmpty()) throw new AppException(ProfileErrorCode.INVALID_PROFILE_DATA);
        var allowed = Set.of("displayName", "phone", "preferences");
        body.forEach((key, value) -> {
            if (!allowed.contains(key) || (value != null && !(value instanceof String))) {
                throw new AppException(ProfileErrorCode.INVALID_PROFILE_DATA);
            }
        });
        var request = new ProfileUpdateRequest();
        if (body.containsKey("displayName")) request.setDisplayName((String) body.get("displayName"));
        if (body.containsKey("phone")) request.setPhone((String) body.get("phone"));
        if (body.containsKey("preferences")) request.setPreferences((String) body.get("preferences"));
        return request;
    }
}
