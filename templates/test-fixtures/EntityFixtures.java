package com.example.fixtures;

import org.instancio.Instancio;
import org.instancio.InstancioApi;

import java.util.function.Consumer;

import static org.instancio.Select.field;

/**
 * Khung mẫu dựng entity và DTO cho test.
 *
 * <p>Cách dùng: copy file vào {@code src/test/java/<package-goc>/fixtures/},
 * đổi package, bổ sung hằng số mặc định của từng entity trong module.
 * Giá trị mặc định phải hợp lệ với mọi ràng buộc validation của entity.
 * Mỗi kịch bản override đúng field cần thiết, không dựng object từ đầu.
 *
 * <p>Ví dụ:
 * <pre>
 * SpaServiceEntity active = EntityFixtures.valid(SpaServiceEntity.class);
 * SpaServiceEntity cheap = EntityFixtures.valid(SpaServiceEntity.class,
 *         api -> api.with(field(SpaServiceEntity::getBasePrice), new BigDecimal("100000")));
 * </pre>
 */
public final class EntityFixtures {

    private EntityFixtures() {
    }

    /**
     * Dựng một object với giá trị mặc định hợp lệ.
     */
    public static <T> T valid(Class<T> type) {
        return valid(type, api -> {
        });
    }

    /**
     * Dựng một object với giá trị mặc định hợp lệ, kèm override từng field.
     */
    public static <T> T valid(Class<T> type, Consumer<InstancioApi<T>> overrides) {
        InstancioApi<T> api = Instancio.of(type)
                .generate(field(String.class), gen -> gen.string().length(3, 50));
        overrides.accept(api);
        return api.create();
    }
}
