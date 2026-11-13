package ru.pt.politech2.bff.web;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bff/upstream")
public class UpstreamController {

    private static final String PREFIX = "/bff/upstream/";

    private final UpstreamProxy proxy;

    public UpstreamController(UpstreamProxy proxy) {
        this.proxy = proxy;
    }

    @RequestMapping(value = "/**", method = {
            RequestMethod.GET,
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.DELETE
    })
    public ResponseEntity<String> forward(
            HttpServletRequest request,
            HttpSession session,
            @RequestBody(required = false) JsonNode body) {
        String path = pathAfterPrefix(request.getRequestURI());
        if (!allowed(path)) {
            return ResponseEntity.badRequest().body("{\"message\":\"Unsupported upstream path\"}");
        }
        return proxy.forward(session, request.getMethod(), path, request.getQueryString(), body);
    }

    private static boolean allowed(String path) {
        if (path.contains("..")) {
            return false;
        }
        if (path.startsWith("admin/")) {
            return true;
        }
        return path.equals("sales/quotes") || path.equals("sales/policies");
    }

    private static String pathAfterPrefix(String uri) {
        if (uri == null) {
            return "";
        }
        int index = uri.indexOf(PREFIX);
        if (index < 0) {
            return "";
        }
        return uri.substring(index + PREFIX.length());
    }
}
