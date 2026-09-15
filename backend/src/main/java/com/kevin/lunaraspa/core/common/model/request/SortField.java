package com.kevin.lunaraspa.core.common.model.request;

import lombok.Data;
import org.springframework.data.domain.Sort.Direction;

@Data
public class SortField {
    
    private String field;
    
    private Direction direction = Direction.ASC;
}
