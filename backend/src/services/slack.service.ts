// Types
type ActivityProcessingSource = 'webhook' | 'after_signup' | 'manual';

interface BaseUserParams {
	userName: string;
	userStravaId: number;
	userId: string;
}

interface ActivityProcessedParams extends BaseUserParams {
	stravaActivityId: number;
	source: ActivityProcessingSource;
}

interface NewUserSignupParams extends BaseUserParams {}

interface ActivityProcessingErrorParams extends ActivityProcessedParams {
	error: string;
}

// Constants
const ACTIVITY_SOURCE_EMOJIS: Record<ActivityProcessingSource, string> = {
	webhook: '🔔',
	after_signup: '🎯',
	manual: '🔧',
} as const;

const NEW_USER_EMOJI = '🎉';

// Helper functions

/**
 * Build activity notification params from user data
 * Reduces code duplication in route handlers
 */
export function buildActivityNotificationParams(
	user: { _id: { toString(): string }; stravaId: number; stravaProfile: { firstname: string; lastname: string } },
	stravaActivityId: number,
	source: ActivityProcessingSource
): ActivityProcessedParams {
	return {
		userName: `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
		userStravaId: user.stravaId,
		userId: user._id.toString(),
		stravaActivityId,
		source,
	};
}

function buildGetoutProfileUrl(userId: string): string {
	return `https://getout.space/profile/${userId}`;
}

function buildStravaProfileUrl(stravaId: number): string {
	return `https://www.strava.com/athletes/${stravaId}`;
}

function buildStravaActivityUrl(activityId: number): string {
	return `https://www.strava.com/activities/${activityId}`;
}

function buildUserLinks(params: BaseUserParams): string {
	const { userName, userStravaId, userId } = params;
	const getoutProfileUrl = buildGetoutProfileUrl(userId);
	const stravaProfileUrl = buildStravaProfileUrl(userStravaId);

	return `👤 <${getoutProfileUrl}|${userName}>
🔗 <${stravaProfileUrl}|Strava Profile>`;
}

function buildActivityLinks(params: ActivityProcessedParams): string {
	const { userName, userStravaId, userId, stravaActivityId } = params;
	const getoutProfileUrl = buildGetoutProfileUrl(userId);
	const stravaProfileUrl = buildStravaProfileUrl(userStravaId);
	const stravaActivityUrl = buildStravaActivityUrl(stravaActivityId);

	return `👤 <${getoutProfileUrl}|${userName}>
🔗 <${stravaProfileUrl}|Strava Profile> | <${stravaActivityUrl}|Activity>`;
}

// Main notification sender
export async function sendSlackNotification(message: string): Promise<void> {
	const webhookUrl = process.env.SLACK_WEBHOOK_URL;

	if (!webhookUrl) {
		console.warn('⚠️ SLACK_WEBHOOK_URL not configured, skipping Slack notification');
		return;
	}

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: message }),
		});

		if (!response.ok) {
			throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
		}

		console.log('✅ Slack notification sent');
	} catch (error) {
		console.error('❌ Failed to send Slack notification:', error);
	}
}

// Notification functions
export async function sendNewUserSignupNotification(params: NewUserSignupParams): Promise<void> {
	const message = `${NEW_USER_EMOJI} *New User Signup!*
${buildUserLinks(params)}`;

	await sendSlackNotification(message);
}

export async function sendActivityProcessedNotification(
	params: ActivityProcessedParams
): Promise<void> {
	const emoji = ACTIVITY_SOURCE_EMOJIS[params.source];

	const message = `${emoji} *Activity Processed*
${buildActivityLinks(params)}`;

	await sendSlackNotification(message);
}

export async function sendActivityProcessingErrorNotification(
	params: ActivityProcessingErrorParams
): Promise<void> {
	const emoji = ACTIVITY_SOURCE_EMOJIS[params.source];

	const message = `${emoji} ❌ *Activity Processing Failed*
${buildActivityLinks(params)}
⚠️ Error: ${params.error}`;

	await sendSlackNotification(message);
}
