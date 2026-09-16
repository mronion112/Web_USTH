package com.kevin.lunaraspa.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI lunaraSpaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Lunara Spa API")
                        .description("Tài liệu tổng hợp các REST API của Lunara Spa")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Lunara Spa Team"))
                        .license(new License()
                                .name("Private API")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập JWT access token, không cần thêm tiền tố Bearer")));
    }
}
