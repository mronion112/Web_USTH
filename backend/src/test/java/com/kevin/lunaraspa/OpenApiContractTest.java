package com.kevin.lunaraspa;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.hamcrest.Matchers.containsString;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OpenApiContractTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void publishesFrontendEndpointsAndAuthenticatedRealtimeApi() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("/api/manager/bookings")))
                .andExpect(content().string(containsString("/api/manager/staff")))
                .andExpect(content().string(containsString("/api/payments")))
                .andExpect(content().string(containsString("/api/payments/sepay/webhook")))
                .andExpect(content().string(containsString("/api/bookings/{bookingCode}/reschedule")))
                .andExpect(content().string(containsString("/api/manager/bookings/{bookingId}/reschedule")))
                .andExpect(content().string(containsString("/api/manager/bookings/{bookingId}/email/resend")))
                .andExpect(content().string(containsString("/api/events")));
    }

    @Test
    void publishesJsonYamlAndSwaggerUiLocally() throws Exception {
        mockMvc.perform(get("/v3/api-docs.yaml")).andExpect(status().isOk());
        mockMvc.perform(get("/swagger-ui.html")).andExpect(status().is3xxRedirection());
    }

    @Test
    void sepayWebhookReachesSignatureVerificationWithoutJwt() throws Exception {
        mockMvc.perform(post("/api/payments/sepay/webhook")
                        .contentType("application/json")
                        .content("{\"id\":1,\"transferAmount\":10000,\"transferType\":\"in\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("PAY_008")));
    }

    @Test
    void documentsSepayWebhookAsHmacAuthenticatedInsteadOfJwtAuthenticated() throws Exception {
        String document = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var operation = objectMapper.readTree(document)
                .path("paths").path("/api/payments/sepay/webhook").path("post");

        assertThat(operation.path("security").isArray()).isTrue();
        assertThat(operation.path("security").isEmpty()).isTrue();
        assertThat(operation.path("parameters").toString())
                .contains("X-SePay-Timestamp", "X-SePay-Signature");
    }
}
