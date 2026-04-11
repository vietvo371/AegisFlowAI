import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Đưa Pusher vào window tập cục bộ để Echo có thể truy cập nếu cần
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

/**
 * Khởi tạo Laravel Echo kết nối với Reverb
 */
const echo = typeof window !== 'undefined' 
  ? new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
      cluster: 'mt1', // Reverb không dùng cluster nhưng Pusher-js yêu cầu (hoặc mặc định)
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || '127.0.0.1',
      wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 6001,
      forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      // Authorization header for private channels
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: typeof localStorage !== 'undefined' ? `Bearer ${localStorage.getItem('aegisflow_token')}` : '',
          Accept: 'application/json',
        },
      },
    })
  : null;

export default echo;
