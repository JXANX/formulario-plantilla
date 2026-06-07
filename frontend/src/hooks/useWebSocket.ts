import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useWebSocket() {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [dashboardUpdates, setDashboardUpdates] = useState<number>(0);
  const [mesaUpdates, setMesaUpdates] = useState<{mesaId: number, estado: string} | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Configurar cliente STOMP sobre SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Conectado a WebSocket');
      
      // Suscribirse a actualizaciones del dashboard
      client.subscribe('/topic/dashboard', (message) => {
        if (message.body) {
          setDashboardUpdates(prev => prev + 1);
        }
      });

      // Suscribirse a actualizaciones de mesas (semáforo)
      client.subscribe('/topic/mesas', (message) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          setMesaUpdates(data);
        }
      });

      // Suscribirse a notificaciones generales
      client.subscribe('/topic/testigos', (message) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          setNotifications(prev => [...prev, data.mensaje]);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('Error de STOMP:', frame.headers['message']);
      console.error('Detalles adicionales:', frame.body);
    };

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  return { stompClient, dashboardUpdates, mesaUpdates, notifications };
}
