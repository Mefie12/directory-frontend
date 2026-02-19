/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/pusher.ts
import Pusher from 'pusher-js';

class PusherService {
  private pusher: any = null;
  private channel: any = null;
  private userId: string | null = null;

  initialize(userId: string, onRoleUpdate: (data: any) => void) {
    if (this.pusher) {
      this.disconnect();
    }

    this.userId = userId;

    // Initialize Pusher
    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
      forceTLS: true,
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    });

    // Subscribe to user's channel
    this.channel = this.pusher.subscribe(`user.${userId}`);

    // Listen for role updates
    this.channel.bind('role.updated', (data: any) => {
      console.log('📡 Pusher: Role updated event received', data);
      onRoleUpdate(data);
    });

    // Handle connection events
    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Pusher: Successfully subscribed to user channel');
    });

    this.channel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Pusher: Subscription error:', error);
    });

    return this;
  }

  disconnect() {
    if (this.channel) {
      this.channel.unbind_all();
      this.channel.unsubscribe();
      this.channel = null;
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.userId = null;
    console.log('🔌 Pusher: Disconnected');
  }

  getUserId() {
    return this.userId;
  }
}

// Create a singleton instance
export const pusherService = new PusherService();