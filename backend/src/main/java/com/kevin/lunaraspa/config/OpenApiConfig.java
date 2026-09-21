package com.kevin.lunaraspa.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI lunaraOpenApi() {
        String bearer = "bearerAuth";
        return new OpenAPI()
                .info(new Info().title("Lunara Spa API").version("1.0.0")
                        .description("API contract for the Lunara customer, operations and therapist applications."))
                .addSecurityItem(new SecurityRequirement().addList(bearer))
                .components(new Components().addSecuritySchemes(bearer, new SecurityScheme()
                        .name(bearer).type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }

    @Bean
    OpenApiCustomizer sepayWebhookUsesHmacInsteadOfJwt() {
        return openApi -> openApi.getPaths().get("/api/payments/sepay/webhook")
                .getPost().setSecurity(Collections.emptyList());
    }
}
