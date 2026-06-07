package com.electoral.testigos.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notificarCambioMesa(Long mesaId, String estadoSemaforo) {
        messagingTemplate.convertAndSend("/topic/mesas", "{\"mesaId\": " + mesaId + ", \"estado\": \"" + estadoSemaforo + "\"}");
    }

    public void notificarNuevoTestigo(String municipio, String puesto) {
        messagingTemplate.convertAndSend("/topic/testigos", "{\"mensaje\": \"Nuevo testigo en " + municipio + " - " + puesto + "\"}");
    }

    public void notificarDashboardUpdate() {
        messagingTemplate.convertAndSend("/topic/dashboard", "{\"update\": true}");
    }
}
