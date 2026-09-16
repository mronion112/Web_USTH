package com.kevin.lunaraspa.feedback.service.impl;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.feedback.dto.CreateFeedbackRequest;
import com.kevin.lunaraspa.feedback.dto.FeedbackResponse;
import com.kevin.lunaraspa.feedback.entity.Feedback;
import com.kevin.lunaraspa.feedback.exception.FeedbackErrorCode;
import com.kevin.lunaraspa.feedback.repository.FeedbackRepository;
import com.kevin.lunaraspa.feedback.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private static final String COMPLETED_STATUS = "COMPLETED";

    private final FeedbackRepository feedbackRepository;

    @Override
    @Transactional
    public FeedbackResponse createFeedback(CreateFeedbackRequest request, String currentUserEmail) {
        validateRequest(request);

        String bookingStatus = feedbackRepository.findBookingStatusById(request.getBookingId())
                .orElseThrow(() -> new AppException(FeedbackErrorCode.BOOKING_NOT_FOUND));

        if (!COMPLETED_STATUS.equals(bookingStatus)) {
            throw new AppException(FeedbackErrorCode.BOOKING_NOT_COMPLETED);
        }

        if (currentUserEmail == null
                || feedbackRepository.countActiveBookingOwner(request.getBookingId(), currentUserEmail) == 0) {
            throw new AppException(FeedbackErrorCode.BOOKING_ACCESS_DENIED);
        }

        if (feedbackRepository.existsByBookingId(request.getBookingId())) {
            throw new AppException(FeedbackErrorCode.FEEDBACK_ALREADY_EXISTS);
        }

        Feedback feedback = Feedback.builder()
                .bookingId(request.getBookingId())
                .rating(request.getRating().byteValue())
                .comment(normalizeComment(request.getComment()))
                .build();

        try {
            return toResponse(feedbackRepository.saveAndFlush(feedback));
        } catch (DataIntegrityViolationException exception) {
            // The unique database constraint remains the final guard against
            // concurrent requests creating feedback for the same booking.
            throw new AppException(FeedbackErrorCode.FEEDBACK_ALREADY_EXISTS);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackByBookingId(Long bookingId) {
        validateBookingId(bookingId);

        return feedbackRepository.findByBookingId(bookingId)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(FeedbackErrorCode.FEEDBACK_NOT_FOUND));
    }

    private void validateRequest(CreateFeedbackRequest request) {
        if (request == null) {
            throw new AppException(FeedbackErrorCode.INVALID_RATING);
        }

        validateBookingId(request.getBookingId());

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new AppException(FeedbackErrorCode.INVALID_RATING);
        }
    }

    private void validateBookingId(Long bookingId) {
        if (bookingId == null || bookingId <= 0) {
            throw new AppException(FeedbackErrorCode.INVALID_BOOKING_ID);
        }
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }

        String normalized = comment.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .bookingId(feedback.getBookingId())
                .rating(feedback.getRating().intValue())
                .comment(feedback.getComment())
                .build();
    }
}
