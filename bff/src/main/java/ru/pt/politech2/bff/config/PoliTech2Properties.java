package ru.pt.politech2.bff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "politech2")
public class PoliTech2Properties {

    /**
     * Base URL of PoliTechAPI, without a trailing slash.
     * Example: http://backend:8080
     */
    private String apiUrl = "http://localhost:8080";

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }
}
