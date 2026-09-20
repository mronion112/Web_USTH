package com.kevin.lunaraspa.booking.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.springframework.http.HttpStatus;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingApiResponse<T> {
    private boolean success;
    private int status;
    private String message;
    private T data;

    public static <T> BookingApiResponse<T> success(String message, T data) {
        return success(message, data, HttpStatus.OK);
    }

    public static <T> BookingApiResponse<T> success(String message, T data, HttpStatus status) {
        return BookingApiResponse.<T>builder()
                .success(true)
                .status(status.value())
                .message(message)
                .data(data)
                .build();
    }
}
