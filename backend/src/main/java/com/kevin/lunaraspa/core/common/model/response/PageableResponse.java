package com.kevin.lunaraspa.core.common.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PageableResponse<T> {
    
    private List<T> content;
    
    private int pageNumber;
    
    private int pageSize;
    
    private int totalPages;
    
    private long totalElements;
    
    private int numberOfElements;
}
