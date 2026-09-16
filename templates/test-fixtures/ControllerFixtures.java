package com.example.fixtures;

import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Khung mẫu override kịch bản cho controller test ({@code @WebMvcTest} + mock service).
 *
 * <p>Cách dùng: copy file vào {@code src/test/java/<package-goc>/fixtures/},
 * đổi package, thay endpoint và field JSON theo API của module.
 * Mọi response tuân thủ shape chung {@code {success, message, data, timestamp}}.
 * Stub service bằng Mockito, override đúng field phân biệt kịch bản.
 */
public final class ControllerFixtures {

    private ControllerFixtures() {
    }

    /**
     * GET chi tiết thành công, kiểm tra shape response chung.
     */
    public static void expectDetailOk(MockMvc mvc, String url, String jsonField,
            String expectedValue) throws Exception {
        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data." + jsonField).value(expectedValue));
    }

    /**
     * POST tạo mới thành công, mock service đã stub sẵn trong test.
     */
    public static void expectCreated(MockMvc mvc, String url, String body) throws Exception {
        mvc.perform(post(url).contentType("application/json").content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    /**
     * GET tài nguyên không tồn tại, kiểm tra shape lỗi chung.
     */
    public static void expectNotFound(MockMvc mvc, String url) throws Exception {
        mvc.perform(get(url))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
