import * as amplitude from '@amplitude/analytics-browser';

// Event type definitions for type-safe tracking
export interface AnalyticsEvents {
  // Page views
  page_viewed: {
    page_name: string;
    page_path: string;
  };

  // Authentication
  login_started: Record<string, never>;
  login_completed: {
    user_id: string;
    strava_id: number;
    is_new_user: boolean;
  };
  logout: Record<string, never>;
  email_submitted: Record<string, never>;

  // Map interactions
  map_moved: {
    zoom_level: number;
    center_lat: number;
    center_lng: number;
  };
  map_zoomed: {
    old_zoom: number;
    new_zoom: number;
  };
  hexagon_clicked: {
    hexagon_id: string;
    owner_id?: string;
    is_own_hexagon: boolean;
  };
  view_mode_changed: {
    mode: 'only_you' | 'battle_mode';
  };

  // User interactions
  profile_viewed: {
    viewed_user_id: string;
    is_own_profile: boolean;
  };
  activity_deleted: {
    activity_id: string;
    hexagon_count: number;
  };
  profile_updated: {
    fields_changed: string[];
  };
  profile_image_uploaded: Record<string, never>;

  // Sharing
  share_initiated: {
    share_type: 'map' | 'profile';
  };
  share_image_generated: {
    hexagon_count: number;
    generation_time_ms: number;
  };
  share_image_downloaded: Record<string, never>;
  share_image_clicked: Record<string, never>;
  share_link_clicked: Record<string, never>;

  // Activity feed
  activity_feed_opened: Record<string, never>;
  activity_feed_closed: Record<string, never>;
  notification_clicked: {
    notification_type: string;
  };

  // UI Interactions
  leaderboard_opened: Record<string, never>;
  leaderboard_closed: Record<string, never>;
  activities_modal_opened: Record<string, never>;
  activities_modal_closed: Record<string, never>;
  notifications_opened: Record<string, never>;
  notifications_closed: Record<string, never>;
  profile_button_clicked: {
    from_location: 'navbar' | 'user_card' | 'mobile_nav';
  };
  admin_button_clicked: Record<string, never>;

  // Errors
  error_occurred: {
    error_type: string;
    error_message: string;
    page: string;
  };
}

export type EventName = keyof AnalyticsEvents;
export type EventProperties<T extends EventName> = AnalyticsEvents[T];

class Analytics {
  private initialized = false;

  init(apiKey: string, userId?: string) {
    if (!apiKey) {
      console.warn('Amplitude API key not provided. Analytics disabled.');
      return;
    }

    amplitude.init(apiKey, userId, {
      defaultTracking: {
        pageViews: false, // We'll track these manually for more control
        sessions: true,
        formInteractions: true,
        fileDownloads: true,
      },
      autocapture: {
        elementInteractions: true,
      },
    });

    this.initialized = true;
  }

  track<T extends EventName>(
    eventName: T,
    properties: EventProperties<T>
  ): void {
    if (!this.initialized) return;

    try {
      amplitude.track(eventName, properties as Record<string, unknown>);
    } catch (error) {
      // Analytics failure should never break the app
      console.warn('Analytics track error:', error);
    }
  }

  identify(userId: string, properties?: Record<string, unknown>): void {
    if (!this.initialized) return;

    try {
      const identifyEvent = new amplitude.Identify();

      if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
          identifyEvent.set(key, value as string | number | boolean | string[] | number[]);
        });
      }

      amplitude.setUserId(userId);
      amplitude.identify(identifyEvent);
    } catch (error) {
      console.warn('Analytics identify error:', error);
    }
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (!this.initialized) return;

    try {
      const identifyEvent = new amplitude.Identify();
      Object.entries(properties).forEach(([key, value]) => {
        identifyEvent.set(key, value as string | number | boolean | string[] | number[]);
      });
      amplitude.identify(identifyEvent);
    } catch (error) {
      console.warn('Analytics setUserProperties error:', error);
    }
  }

  reset(): void {
    if (!this.initialized) return;
    try {
      amplitude.reset();
    } catch (error) {
      console.warn('Analytics reset error:', error);
    }
  }
}

export const analytics = new Analytics();
