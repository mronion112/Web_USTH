package com.kevin.lunaraspa.feedback;

import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.feedback.dto.CreateFeedbackRequest;
import com.kevin.lunaraspa.feedback.dto.FeedbackApiResponse;
import com.kevin.lunaraspa.feedback.dto.FeedbackResponse;
import com.kevin.lunaraspa.feedback.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "${app.frontend-url}")
@Tag(name = "Feedback", description = "Đánh giá booking")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @Operation(summary = "Tạo feedback cho booking")
    public ResponseEntity<FeedbackApiResponse<FeedbackResponse>> createFeedback(
            @RequestBody CreateFeedbackRequest request
    ) {
        FeedbackResponse feedback = feedbackService.createFeedback(
                request,
                SecurityUtils.getCurrentUserEmail()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(FeedbackApiResponse.success("Create feedback successfully", feedback));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Lấy feedback theo booking")
    public ResponseEntity<FeedbackApiResponse<FeedbackResponse>> getFeedbackByBooking(
            @PathVariable Long bookingId
    ) {
        FeedbackResponse feedback = feedbackService.getFeedbackByBookingId(bookingId);
        return ResponseEntity.ok(
                FeedbackApiResponse.success("Get feedback successfully", feedback)
        );
    }
}
