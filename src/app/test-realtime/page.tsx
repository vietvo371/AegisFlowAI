'use client';

import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';
import { Button } from '@/components/ui/button';

export default function TestRealtimePage() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[TestRealtime] Initializing...');
    console.log('[TestRealtime] Env:', {
      key: process.env.NEXT_PUBLIC_REVERB_KEY,
      host: process.env.NEXT_PUBLIC_REVERB_HOST,
      port: process.env.NEXT_PUBLIC_REVERB_PORT,
      scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME,
    });

    try {
      const echo = getEcho();
      console.log('[TestRealtime] Echo instance:', echo);

      const channel = echo.channel('flood');
      console.log('[TestRealtime] Channel:', channel);

      channel.subscribed(() => {
        console.log('[TestRealtime] ✅ Subscribed!');
        setConnected(true);
        setLogs(prev => [...prev, '✅ Subscribed to channel: flood']);
      });

      channel.error((err: any) => {
        console.error('[TestRealtime] ❌ Channel error:', err);
        setLogs(prev => [...prev, `❌ Error: ${JSON.stringify(err)}`]);
      });

      // Test both with and without dot prefix
      channel.listen('.IncidentCreated', (data: any) => {
        console.log('[TestRealtime] 🔔 .IncidentCreated:', data);
        setMessages(prev => [...prev, `🔔 .IncidentCreated: ${JSON.stringify(data)}`]);
      });

      channel.listen('IncidentCreated', (data: any) => {
        console.log('[TestRealtime] 🔔 IncidentCreated (no dot):', data);
        setMessages(prev => [...prev, `🔔 IncidentCreated: ${JSON.stringify(data)}`]);
      });

      channel.listen('.AlertCreated', (data: any) => {
        console.log('[TestRealtime] 🔔 .AlertCreated:', data);
        setMessages(prev => [...prev, `🔔 .AlertCreated: ${JSON.stringify(data)}`]);
      });

      channel.listen('AlertCreated', (data: any) => {
        console.log('[TestRealtime] 🔔 AlertCreated (no dot):', data);
        setMessages(prev => [...prev, `🔔 AlertCreated: ${JSON.stringify(data)}`]);
      });

      channel.listen('.RescueRequestCreated', (data: any) => {
        console.log('[TestRealtime] 🔔 .RescueRequestCreated:', data);
        setMessages(prev => [...prev, `🔔 .RescueRequestCreated: ${JSON.stringify(data)}`]);
      });

      channel.listen('RescueRequestCreated', (data: any) => {
        console.log('[TestRealtime] 🔔 RescueRequestCreated (no dot):', data);
        setMessages(prev => [...prev, `🔔 RescueRequestCreated: ${JSON.stringify(data)}`]);
      });

      channel.listen('.RescueRequestUpdated', (data: any) => {
        console.log('[TestRealtime] 🔔 .RescueRequestUpdated:', data);
        setMessages(prev => [...prev, `🔔 .RescueRequestUpdated: ${JSON.stringify(data)}`]);
      });

      channel.listen('RescueRequestUpdated', (data: any) => {
        console.log('[TestRealtime] 🔔 RescueRequestUpdated (no dot):', data);
        setMessages(prev => [...prev, `🔔 RescueRequestUpdated: ${JSON.stringify(data)}`]);
      });

      channel.listen('.IncidentResolved', (data: any) => {
        console.log('[TestRealtime] 🔔 .IncidentResolved:', data);
        setMessages(prev => [...prev, `🔔 .IncidentResolved: ${JSON.stringify(data)}`]);
      });

      channel.listen('IncidentResolved', (data: any) => {
        console.log('[TestRealtime] 🔔 IncidentResolved (no dot):', data);
        setMessages(prev => [...prev, `🔔 IncidentResolved: ${JSON.stringify(data)}`]);
      });

      setLogs(prev => [...prev, '🔌 Connecting to ws://localhost:8080...']);

    } catch (err) {
      console.error('[TestRealtime] ❌ Failed:', err);
      setLogs(prev => [...prev, `❌ Failed: ${err}`]);
    }

    return () => {
      try {
        const echo = getEcho();
        echo.leaveChannel('flood');
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Realtime Test Page</h1>

      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
          {connected ? '🟢 Connected' : '🟡 Connecting...'}
        </span>
      </div>

      <div className="mb-4 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">Connection Logs:</h2>
        {logs.map((log, i) => (
          <div key={i} className="text-sm font-mono">{log}</div>
        ))}
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">Received Events:</h2>
        {messages.length === 0 ? (
          <p className="text-muted-foreground">No events received yet. Run ./test_realtime_flow.sh</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="text-sm font-mono mb-1">{msg}</div>
          ))
        )}
      </div>
    </div>
  );
}
