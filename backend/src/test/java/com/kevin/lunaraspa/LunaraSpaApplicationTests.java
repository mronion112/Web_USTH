package com.kevin.lunaraspa;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.chatbot.chroma.startup-indexing=false")
class LunaraSpaApplicationTests {

    @Test
    void contextLoads() {
    }

}
