package com.kevin.lunaraspa.booking.service;

import com.kevin.lunaraspa.booking.dto.AvailabilityRequest;
import com.kevin.lunaraspa.booking.dto.AvailabilityResponse;

public interface AvailabilityService {
    AvailabilityResponse findAvailability(AvailabilityRequest request);
}
