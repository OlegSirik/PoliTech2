package ru.pt.politech2.bff.web.dto;

public class SessionView {

    private boolean authenticated;
    private String tenantCode;
    private String userLogin;
    private String clientId;

    public static SessionView anonymous() {
        SessionView view = new SessionView();
        view.authenticated = false;
        return view;
    }

    public static SessionView of(String tenantCode, String userLogin, String clientId) {
        SessionView view = new SessionView();
        view.authenticated = true;
        view.tenantCode = tenantCode;
        view.userLogin = userLogin;
        view.clientId = clientId;
        return view;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getUserLogin() {
        return userLogin;
    }

    public void setUserLogin(String userLogin) {
        this.userLogin = userLogin;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
}
