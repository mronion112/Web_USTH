package com.kevin.lunaraspa;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OpenApiContractTest {
    @Autowired MockMvc mockMvc;

    @Test
    void publishesFrontendEndpointsAndAuthenticatedRealtimeApi() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("/api/manager/bookings")))
                .andExpect(content().string(containsString("/api/manager/staff")))
                .andExpect(content().string(containsString("/api/payments")))
                .andExpect(content().string(containsString("/api/bookings/{bookingCode}/reschedule")))
                .andExpect(content().string(containsString("/api/events")));
    }

    @Test
    void publishesJsonYamlAndSwaggerUiLocally() throws Exception {
        mockMvc.perform(get("/v3/api-docs.yaml")).andExpect(status().isOk());
        mockMvc.perform(get("/swagger-ui.html")).andExpect(status().is3xxRedirection());
    }
}
