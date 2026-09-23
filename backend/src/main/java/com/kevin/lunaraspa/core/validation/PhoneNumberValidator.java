package com.kevin.lunaraspa.core.validation;

import java.util.regex.Pattern;

public final class PhoneNumberValidator {
    private static final Pattern SEPARATORS = Pattern.compile("[\\s().-]");
    private static final Pattern VIETNAM_LOCAL = Pattern.compile("0\\d{9}");
    private static final Pattern INTERNATIONAL = Pattern.compile("\\+[1-9]\\d{8,14}");

    private PhoneNumberValidator() {}

    public static String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        return SEPARATORS.matcher(value.strip()).replaceAll("");
    }

    public static boolean isValid(String normalizedPhone) {
        return normalizedPhone != null
                && (VIETNAM_LOCAL.matcher(normalizedPhone).matches()
                || INTERNATIONAL.matcher(normalizedPhone).matches());
    }
}
