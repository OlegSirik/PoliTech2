package ru.pt.politech2.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PoliTech2BffApplication {

    public static void main(String[] args) {
        SpringApplication.run(PoliTech2BffApplication.class, args);
    }
}
