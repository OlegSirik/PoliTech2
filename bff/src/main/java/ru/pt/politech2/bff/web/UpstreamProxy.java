package ru.pt.politech2.bff.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import ru.pt.politech2.bff.api.PoliTechApiClient;
import ru.pt.politech2.bff.session.BffSessionKeys;

@Component
public class UpstreamProxy {

    private final PoliTechApiClient apiClient;
    private final ObjectMapper objectMapper;

    public UpstreamProxy(PoliTechApiClient apiClient, ObjectMapper objectMapper) {
        this.apiClient = apiClient;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<String> forward(
            HttpSession session, String method, String pathAfterTenant, String rawQuery, JsonNode body) {
        String token = session == null ? null : (String) session.getAttribute(BffSessionKeys.ACCESS_TOKEN);
        String tenantCode = session == null ? null : (String) session.getAttribute(BffSessionKeys.TENANT_CODE);
        if (token == null || token.isBlank() || tenantCode == null || tenantCode.isBlank()) {
            return json(HttpStatus.UNAUTHORIZED, "{\"message\":\"Not authenticated\"}");
        }
        String tokenType = (String) session.getAttribute(BffSessionKeys.TOKEN_TYPE);
        String accountId = (String) session.getAttribute(BffSessionKeys.ACCOUNT_ID);
        try {
            String payload = body == null || body.isNull() ? null : objectMapper.writeValueAsString(body);
            PoliTechApiClient.UpstreamResponse upstream = apiClient.authorized(
                    method, tenantCode, token, tokenType, accountId, pathAfterTenant, rawQuery, payload);
            if (upstream.status() == 401) {
                session.invalidate();
            }
            if (upstream.status() == 204) {
                return ResponseEntity.noContent().build();
            }
            MediaType type = looksLikeJson(upstream.body()) ? MediaType.APPLICATION_JSON : MediaType.TEXT_PLAIN;
            return ResponseEntity.status(upstream.status() > 0 ? upstream.status() : 502)
                    .contentType(type)
                    .body(blankTo(upstream.body(), ""));
        } catch (ResourceAccessException ex) {
            return json(HttpStatus.BAD_GATEWAY, "{\"message\":\"BFF cannot reach PoliTechAPI at "
                    + escapeJson(apiClient.getBaseUrl()) + ": " + escapeJson(ex.getMessage()) + "\"}");
        } catch (Exception ex) {
            return json(HttpStatus.BAD_GATEWAY, "{\"message\":\"Proxy error: " + escapeJson(ex.getMessage()) + "\"}");
        }
    }

    public String resolveAccountId(String tenantCode, String accessToken, String tokenType) {
        try {
            PoliTechApiClient.UpstreamResponse me =
                    apiClient.authorized("GET", tenantCode, accessToken, tokenType, null, "auth/me", null, null);
            JsonNode node = parse(me.body());
            if (!me.success() || node == null || node.isNull() || !node.has("accountId") || node.get("accountId").isNull()) {
                return null;
            }
            return node.get("accountId").asText();
        } catch (Exception ex) {
            return null;
        }
    }

    public JsonNode parse(String body) {
        if (body == null || body.isBlank()) {
            return objectMapper.nullNode();
        }
        try {
            return objectMapper.readTree(body);
        } catch (Exception ex) {
            return objectMapper.nullNode();
        }
    }

    public String apiBaseUrl() {
        return apiClient.getBaseUrl();
    }

    private static ResponseEntity<String> json(HttpStatus status, String body) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body);
    }

    private static boolean looksLikeJson(String body) {
        if (body == null) {
            return false;
        }
        String trimmed = body.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public static String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
