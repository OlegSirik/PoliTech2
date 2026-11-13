package ru.pt.politech2.bff.web;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bff")
public class CatalogController {

    private final UpstreamProxy proxy;

    public CatalogController(UpstreamProxy proxy) {
        this.proxy = proxy;
    }

    @GetMapping("/rules")
    public ResponseEntity<String> listRules(HttpServletRequest request, HttpSession session) {
        return proxy.forward(session, "GET", "admin/rules", request.getQueryString(), null);
    }

    @GetMapping("/rules/{id}")
    public ResponseEntity<String> getRule(@PathVariable long id, HttpSession session) {
        return proxy.forward(session, "GET", "admin/rules/" + id, null, null);
    }

    @PostMapping(value = "/rules", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> createRule(@RequestBody JsonNode body, HttpSession session) {
        return proxy.forward(session, "POST", "admin/rules", null, body);
    }

    @PutMapping(value = "/rules/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> updateRule(@PathVariable long id, @RequestBody JsonNode body, HttpSession session) {
        return proxy.forward(session, "PUT", "admin/rules/" + id, null, body);
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<String> deleteRule(@PathVariable long id, HttpSession session) {
        return proxy.forward(session, "DELETE", "admin/rules/" + id, null, null);
    }

    @PostMapping("/rules/cmd/reload")
    public ResponseEntity<String> reloadRules(HttpSession session) {
        return proxy.forward(session, "POST", "admin/rules/cmd/reload", null, null);
    }

    @GetMapping("/refdicts")
    public ResponseEntity<String> listDicts(HttpSession session) {
        return proxy.forward(session, "GET", "admin/refdicts", null, null);
    }

    @PostMapping(value = "/refdicts", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> createDict(@RequestBody JsonNode body, HttpSession session) {
        return proxy.forward(session, "POST", "admin/refdicts", null, body);
    }

    @PutMapping(value = "/refdicts/{code}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> updateDict(
            @PathVariable String code, @RequestBody JsonNode body, HttpSession session) {
        return proxy.forward(session, "PUT", "admin/refdicts/" + segment(code), null, body);
    }

    @DeleteMapping("/refdicts/{code}")
    public ResponseEntity<String> deleteDict(@PathVariable String code, HttpSession session) {
        return proxy.forward(session, "DELETE", "admin/refdicts/" + segment(code), null, null);
    }

    @GetMapping("/refdicts/{code}/items")
    public ResponseEntity<String> listItems(@PathVariable String code, HttpSession session) {
        return proxy.forward(session, "GET", "admin/refdicts/" + segment(code) + "/items", null, null);
    }

    @PostMapping(value = "/refdicts/{code}/items", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> createItem(
            @PathVariable String code, @RequestBody JsonNode body, HttpSession session) {
        return proxy.forward(session, "POST", "admin/refdicts/" + segment(code) + "/items", null, body);
    }

    @PutMapping(value = "/refdicts/{code}/items/{itemCode}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> updateItem(
            @PathVariable String code,
            @PathVariable String itemCode,
            @RequestBody JsonNode body,
            HttpSession session) {
        return proxy.forward(
                session, "PUT", "admin/refdicts/" + segment(code) + "/items/" + segment(itemCode), null, body);
    }

    @DeleteMapping("/refdicts/{code}/items/{itemCode}")
    public ResponseEntity<String> deleteItem(
            @PathVariable String code, @PathVariable String itemCode, HttpSession session) {
        return proxy.forward(
                session, "DELETE", "admin/refdicts/" + segment(code) + "/items/" + segment(itemCode), null, null);
    }

    @GetMapping("/products")
    public ResponseEntity<String> products(HttpServletRequest request, HttpSession session) {
        return proxy.forward(session, "GET", "admin/products", request.getQueryString(), null);
    }

    @GetMapping("/tenant/llm-config")
    public ResponseEntity<String> llmConfig(HttpSession session) {
        return proxy.forward(session, "GET", "admin/tenant/llm-config", null, null);
    }

    @PostMapping(value = "/products/{productId}/versions/{versionNo}/llm/assist", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> assistProduct(
            @PathVariable long productId,
            @PathVariable long versionNo,
            @RequestBody JsonNode body,
            HttpSession session) {
        return proxy.forward(
                session,
                "POST",
                "admin/products/" + productId + "/versions/" + versionNo + "/llm/assist",
                null,
                body);
    }

    @PostMapping(value = "/lobs/{lobCode}/llm/assist", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> assistLob(
            @PathVariable String lobCode, @RequestBody JsonNode body, HttpSession session) {
        return proxy.forward(session, "POST", "admin/lobs/" + segment(lobCode) + "/llm/assist", null, body);
    }

    private static String segment(String value) {
        return value == null ? "" : value;
    }
}
