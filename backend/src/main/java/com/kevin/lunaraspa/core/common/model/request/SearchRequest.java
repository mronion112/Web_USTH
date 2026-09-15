package com.kevin.lunaraspa.core.common.model.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kevin.lunaraspa.core.common.model.Pagination;
import com.kevin.lunaraspa.core.common.model.request.SortField;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SearchRequest<T> {
    
    private T filter;
    
    private Pagination pagination;
    
    private List<SortField> sorts;
}
