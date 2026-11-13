package ru.pt.politech2.bff.api;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;
import ru.pt.politech2.bff.config.PoliTech2Properties;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class PoliTechApiClient {

    private final RestClient restClient;
    private final String baseUrl;

    public PoliTechApiClient(RestClient.Builder restClientBuilder, PoliTech2Properties properties) {
        this.baseUrl = trimTrailingSlash(properties.getApiUrl());
        this.restClient = restClientBuilder.baseUrl(this.baseUrl).build();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public UpstreamResponse login(String tenantCode, String userLogin, String password, String clientId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userLogin", userLogin);
        body.put("password", password);
        if (clientId != null && !clientId.isBlank()) {
            body.put("clientId", clientId);
        }
        return exchange(
                restClient.post()
                        .uri("/api/v1/{tenant}/auth/login", tenantCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(body));
    }

    public UpstreamResponse authorized(
            String method,
            String tenantCode,
            String accessToken,
            String tokenType,
            String accountId,
            String pathAfterTenant,
            String rawQuery,
            String jsonBody) {
        String auth = (tokenType == null || tokenType.isBlank() ? "Bearer" : tokenType) + " " + accessToken;
        URI uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/v1/{tenant}/")
                .path(pathAfterTenant)
                .buildAndExpand(tenantCode)
                .encode()
                .toUri();
        if (rawQuery != null && !rawQuery.isBlank()) {
            uri = URI.create(uri.toASCIIString() + "?" + rawQuery);
        }

        RestClient.RequestBodySpec spec = restClient.method(HttpMethod.valueOf(method))
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .header("Authorization", auth);
        if (accountId != null && !accountId.isBlank()) {
            spec = spec.header("X-Account-Id", accountId);
        }
        RestClient.RequestHeadersSpec<?> ready = spec;
        if (jsonBody != null) {
            ready = spec.contentType(MediaType.APPLICATION_JSON).body(jsonBody);
        }
        return exchange(ready);
    }

    private UpstreamResponse exchange(RestClient.RequestHeadersSpec<?> spec) {
        try {
            ResponseEntity<String> entity = spec.retrieve().toEntity(String.class);
            return new UpstreamResponse(entity.getStatusCode().value(), entity.getBody(), true);
        } catch (RestClientResponseException ex) {
            return new UpstreamResponse(ex.getStatusCode().value(), ex.getResponseBodyAsString(), false);
        }
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "http://localhost:8080";
        }
        return url.replaceAll("/+$", "");
    }

    public record UpstreamResponse(int status, String body, boolean success) {
    }
}
