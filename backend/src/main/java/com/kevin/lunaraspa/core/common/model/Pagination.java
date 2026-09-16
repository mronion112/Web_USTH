package com.kevin.lunaraspa.core.common.model;

import lombok.Data;

@Data
public class Pagination {
    
    private int page = 0;
    
    private int size = 10;
}
