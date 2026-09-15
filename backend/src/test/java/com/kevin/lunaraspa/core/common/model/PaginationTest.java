package com.kevin.lunaraspa.core.common.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaginationTest {

    @Test
    void testDefaultValues() {
        Pagination pagination = new Pagination();
        assertEquals(0, pagination.getPage(), "Default page should be 0");
        assertEquals(10, pagination.getSize(), "Default size should be 10");
    }
}
