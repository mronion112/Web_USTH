package com.kevin.lunaraspa.feedback.service;

import com.kevin.lunaraspa.feedback.dto.CreateFeedbackRequest;
import com.kevin.lunaraspa.feedback.dto.FeedbackResponse;

public interface FeedbackService {
    FeedbackResponse createFeedback(CreateFeedbackRequest request, String currentUserEmail);

    FeedbackResponse getFeedbackByBookingId(Long bookingId);
}
