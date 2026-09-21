package com.kevin.lunaraspa.email;

public interface EmailDeliveryClient {
    String send(OutboundEmail email);
}
