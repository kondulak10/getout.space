import { IUser } from '../models/User';

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
    let errorBody = '';
    let errorData: any = {};

    try {
      errorBody = await response.text();
      errorData = JSON.parse(errorBody);
    } catch (e) {
      errorData = { raw: errorBody };
    }

    console.error('❌ Token refresh failed:', {
      status: response.status,
      statusText: response.statusText,
      userId: user._id,
      stravaId: user.stravaId,
      userName: `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
      errorData,
      tokenExpiresAt: user.tokenExpiresAt,
      tokenExpiresAtDate: new Date(user.tokenExpiresAt * 1000).toISOString(),
      refreshTokenPrefix: user.refreshToken.length >= 10 ? user.refreshToken.substring(0, 10) + '...' : '[short]',
      refreshTokenLength: user.refreshToken.length,
    });

    if (response.status === 401) {
      throw new Error(`Token refresh failed with 401 - refresh token may have been already used or user revoked access (user: ${user.stravaProfile.firstname})`);
    }

    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
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
