package vn.edu.usth.lunara.spaservice.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import vn.edu.usth.lunara.common.exception.ResourceNotFoundException;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceResponse;
import vn.edu.usth.lunara.spaservice.dto.SpaServiceListResponse;
import vn.edu.usth.lunara.spaservice.service.SpaServiceService;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {SpaServiceController.class, ManagerSpaServiceController.class})
class SpaServiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SpaServiceService service;

    @Test
    void returnsServiceCatalogUsingCommonResponse() throws Exception {
        when(service.getActiveServices()).thenReturn(List.of(new SpaServiceListResponse(
                1L,
                "Facial Care",
                "FACIAL",
                "Sensitive skin treatment",
                null,
                new BigDecimal("350000"),
                60,
                true,
                30,
                new BigDecimal("120000"),
                true
        )));

        mockMvc.perform(get("/api/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Get services successfully"))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Facial Care"))
                .andExpect(jsonPath("$.data[0].isActive").value(true))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void returnsNotFoundUsingCommonErrorResponse() throws Exception {
        when(service.getActiveService(999L))
                .thenThrow(new ResourceNotFoundException("Service not found: 999"));

        mockMvc.perform(get("/api/services/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Service not found: 999"))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void createsServiceAndReturns201() throws Exception {
        when(service.createService(any())).thenReturn(
                new CreateSpaServiceResponse(7L, "Facial Care", true)
        );

        mockMvc.perform(post("/api/manager/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Facial Care",
                                  "category": "FACIAL",
                                  "description": "Sensitive skin treatment",
                                  "basePrice": 350000,
                                  "minimumDurationMinutes": 60,
                                  "isDurationAdjustable": true,
                                  "durationStepMinutes": 30,
                                  "pricePerDurationStep": 120000,
                                  "preparationBufferMinutes": 10,
                                  "cleanupBufferMinutes": 10
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Create service successfully"))
                .andExpect(jsonPath("$.data.id").value(7))
                .andExpect(jsonPath("$.data.isActive").value(true));
    }

    @Test
    void rejectsInvalidDurationConfiguration() throws Exception {
        mockMvc.perform(post("/api/manager/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Fixed Facial",
                                  "category": "FACIAL",
                                  "basePrice": 350000,
                                  "minimumDurationMinutes": 60,
                                  "isDurationAdjustable": false,
                                  "durationStepMinutes": 30,
                                  "pricePerDurationStep": 120000,
                                  "preparationBufferMinutes": 10,
                                  "cleanupBufferMinutes": 10
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(
                        "durationConfigurationValid: duration step and price must be null when duration is fixed, or valid when adjustable"
                ));
    }

    @Test
    void rejectsMalformedJsonUsingCommonErrorResponse() throws Exception {
        mockMvc.perform(post("/api/manager/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Facial Care\","))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(
                        "Request body is malformed or has invalid field types"
                ));
    }
}
