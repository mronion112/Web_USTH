package com.kevin.lunaraspa.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFeedbackRequest {
    private Long bookingId;
    private Integer rating;
    private String comment;
}
