package ru.pt.politech2.bff.config;

import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Serves the built console from {@code /app/static} and falls back to
 * {@code index.html} for client-side routes. {@code /bff/**} stays with the API.
 */
class SpaResourceResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(String resourcePath, Resource location) throws IOException {
        if (!location.exists()) {
            return null;
        }
        Resource resource = super.getResource(resourcePath, location);
        if (resource != null) {
            return resource;
        }
        if (resourcePath.equals("bff") || resourcePath.startsWith("bff/")) {
            return null;
        }
        return super.getResource("index.html", location);
    }
}
