import { IUser } from '../models/User';

/**
 * Refresh a user's Strava access token using their refresh token
 * @param user - The user whose token should be refreshed
 * @returns The updated token data from Strava
 */
export async function refreshStravaToken(user: IUser): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}> {
  console.log(`🔄 Refreshing Strava token for user: ${user.stravaProfile.firstname}`);

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Token refresh failed:', response.status, errorData);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
  };

  console.log('✅ Token refreshed successfully');
  console.log('📊 New token data from Strava:', {
    expires_at: data.expires_at,
    expires_in: data.expires_in,
    expires_at_date: new Date(data.expires_at * 1000).toISOString(),
  });

  return data;
}
