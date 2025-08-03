import { useState, useEffect, useRef } from 'react';

export function useStableWebSocket(url: string, onMessage: (message: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const connect = () => {
    if (!mountedRef.current) return;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}${url}`;
      
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('Stable WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log('Stable WebSocket disconnected');
        setIsConnected(false);
        
        // Reconnect after 3 seconds only if component is still mounted
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (mountedRef.current) {
          setIsConnected(false);
        }
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (mountedRef.current) {
        setIsConnected(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();
    
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { isConnected };
}