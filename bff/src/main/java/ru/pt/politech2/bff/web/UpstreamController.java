package ru.pt.politech2.bff.web;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.regex.Pattern;

@RestController
@RequestMapping("/bff/upstream")
public class UpstreamController {

    private static final Pattern PRINT_PATH = Pattern.compile("sales/policies/[^/]+/printpf/[^/]+");
    private static final Pattern SALES_ITEM = Pattern.compile("sales/[^/]+");

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
    public ResponseEntity<?> forward(
            HttpServletRequest request,
            HttpSession session,
            @RequestBody(required = false) JsonNode body) {
        String path = pathAfterPrefix(request.getRequestURI());
        if (!allowed(path)) {
            return ResponseEntity.badRequest().body("{\"message\":\"Unsupported upstream path\"}");
        }
        if (PRINT_PATH.matcher(path).matches()) {
            return proxy.forwardBinary(session, request.getMethod(), path, request.getQueryString());
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
        if (path.equals("sales/quotes") || path.equals("sales/policies") || path.equals("lk/products-for-quote")) {
            return true;
        }
        return SALES_ITEM.matcher(path).matches() || PRINT_PATH.matcher(path).matches();
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
