package com.kevin.lunaraspa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LunaraSpaApplication {

    public static void main(String[] args) {
        SpringApplication.run(LunaraSpaApplication.class, args);
    }

}
