package ru.pt.politech2.bff.web;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.ResourceAccessException;
import ru.pt.politech2.bff.api.PoliTechApiClient;
import ru.pt.politech2.bff.session.BffSessionKeys;
import ru.pt.politech2.bff.web.dto.LoginRequest;
import ru.pt.politech2.bff.web.dto.MessageResponse;
import ru.pt.politech2.bff.web.dto.SessionView;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/bff")
public class AuthController {

    private final PoliTechApiClient apiClient;
    private final UpstreamProxy proxy;

    public AuthController(PoliTechApiClient apiClient, UpstreamProxy proxy) {
        this.apiClient = apiClient;
        this.proxy = proxy;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("politechApiUrl", apiClient.getBaseUrl());
        return body;
    }

    @GetMapping("/session")
    public SessionView session(HttpSession session) {
        String token = (String) session.getAttribute(BffSessionKeys.ACCESS_TOKEN);
        if (token == null || token.isBlank()) {
            return SessionView.anonymous();
        }
        return SessionView.of(
                (String) session.getAttribute(BffSessionKeys.TENANT_CODE),
                (String) session.getAttribute(BffSessionKeys.USER_LOGIN),
                (String) session.getAttribute(BffSessionKeys.CLIENT_ID));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String tenantCode = trim(request.getTenantCode());
        String userLogin = trim(request.getUserLogin());
        String password = request.getPassword() == null ? "" : request.getPassword();
        String clientId = trim(request.getClientId());

        if (tenantCode.isEmpty() || userLogin.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Укажите тенант, логин и пароль"));
        }

        try {
            PoliTechApiClient.UpstreamResponse upstream =
                    apiClient.login(tenantCode, userLogin, password, clientId.isEmpty() ? null : clientId);
            JsonNode data = proxy.parse(upstream.body());
            String accessToken = textOrNull(data, "accessToken");
            if (!upstream.success() || accessToken == null || accessToken.isBlank()) {
                String message = textOrNull(data, "message");
                if (message == null) {
                    message = textOrNull(data, "error");
                }
                if (message == null || message.isBlank()) {
                    message = blankTo(upstream.body(), "Неверный тенант, логин или пароль");
                }
                return ResponseEntity.status(upstream.status() > 0 ? upstream.status() : 502)
                        .body(new MessageResponse(message));
            }

            HttpSession old = httpRequest.getSession(false);
            if (old != null) {
                old.invalidate();
            }
            String tokenType = blankTo(textOrNull(data, "tokenType"), "Bearer");
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(BffSessionKeys.ACCESS_TOKEN, accessToken);
            session.setAttribute(BffSessionKeys.TOKEN_TYPE, tokenType);
            session.setAttribute(BffSessionKeys.TENANT_CODE, tenantCode);
            session.setAttribute(BffSessionKeys.USER_LOGIN, userLogin);
            session.setAttribute(BffSessionKeys.CLIENT_ID, clientId.isEmpty() ? null : clientId);
            session.setAttribute(BffSessionKeys.ACCOUNT_ID, proxy.resolveAccountId(tenantCode, accessToken, tokenType));
            return ResponseEntity.ok(SessionView.of(tenantCode, userLogin, clientId.isEmpty() ? null : clientId));
        } catch (ResourceAccessException ex) {
            return ResponseEntity.status(502).body(new MessageResponse(
                    "BFF не достучался до PoliTechAPI: " + apiClient.getBaseUrl()));
        } catch (Exception ex) {
            return ResponseEntity.status(502).body(new MessageResponse("Ошибка входа: " + ex.getMessage()));
        }
    }

    @PostMapping(value = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null || node.isNull() || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
