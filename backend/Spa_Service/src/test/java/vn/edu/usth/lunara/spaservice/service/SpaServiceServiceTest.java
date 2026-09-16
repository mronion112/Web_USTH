package vn.edu.usth.lunara.spaservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.edu.usth.lunara.common.exception.DuplicateResourceException;
import vn.edu.usth.lunara.common.exception.ResourceNotFoundException;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceRequest;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceResponse;
import vn.edu.usth.lunara.spaservice.dto.SpaServiceDetailResponse;
import vn.edu.usth.lunara.spaservice.entity.SpaServiceEntity;
import vn.edu.usth.lunara.spaservice.repository.SpaServiceRepository;
import vn.edu.usth.lunara.spaservice.repository.StaffSummaryProjection;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpaServiceServiceTest {

    @Mock
    private SpaServiceRepository repository;

    private SpaServiceService service;

    @BeforeEach
    void setUp() {
        service = new SpaServiceService(repository);
    }

    @Test
    void returnsActiveServiceDetailWithStaff() {
        SpaServiceEntity entity = serviceEntity("Facial Care");
        ReflectionTestUtils.setField(entity, "id", 1L);

        StaffSummaryProjection projection = new StaffSummaryProjection() {
            @Override
            public Long getAccountId() {
                return 21L;
            }

            @Override
            public String getDisplayName() {
                return "Tran Thi Lan";
            }
        };

        when(repository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(entity));
        when(repository.findActiveBookableStaffByServiceId(1L)).thenReturn(List.of(projection));

        SpaServiceDetailResponse response = service.getActiveService(1L);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.staff()).hasSize(1);
        assertThat(response.staff().getFirst().displayName()).isEqualTo("Tran Thi Lan");
    }

    @Test
    void throwsNotFoundWhenServiceIsMissingOrInactive() {
        when(repository.findByIdAndActiveTrue(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveService(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Service not found: 999");
    }

    @Test
    void rejectsDuplicateNameBeforeSaving() {
        CreateSpaServiceRequest request = validCreateRequest(" Facial Care ");
        when(repository.existsByNameIgnoreCase("Facial Care")).thenReturn(true);

        assertThatThrownBy(() -> service.createService(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Service name already exists: Facial Care");

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createsActiveServiceWithNormalizedText() {
        CreateSpaServiceRequest request = validCreateRequest(" Facial Care ");
        when(repository.existsByNameIgnoreCase("Facial Care")).thenReturn(false);
        when(repository.saveAndFlush(any(SpaServiceEntity.class))).thenAnswer(invocation -> {
            SpaServiceEntity saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 7L);
            return saved;
        });

        CreateSpaServiceResponse response = service.createService(request);

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.name()).isEqualTo("Facial Care");
        assertThat(response.isActive()).isTrue();
    }

    private CreateSpaServiceRequest validCreateRequest(String name) {
        return new CreateSpaServiceRequest(
                name,
                " FACIAL ",
                "  Sensitive skin treatment  ",
                new BigDecimal("350000"),
                60,
                true,
                30,
                new BigDecimal("120000"),
                10,
                10
        );
    }

    private SpaServiceEntity serviceEntity(String name) {
        return new SpaServiceEntity(
                name,
                "FACIAL",
                "Sensitive skin treatment",
                new BigDecimal("350000"),
                60,
                true,
                30,
                new BigDecimal("120000"),
                10,
                10
        );
    }
}
