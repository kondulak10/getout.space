import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/pro-solid-svg-icons';
import { cn } from '@/lib/utils-cn';

interface UserProfile {
	firstname?: string | null;
	lastname?: string | null;
	profile?: string | null;
	imghex?: string | null;
}

interface UserData {
	id?: string;
	stravaId?: number;
	stravaProfile?: UserProfile | null;
}

interface UserAvatarProps {
	user?: UserData | null;
	stravaId?: number;
	size?: 'sm' | 'md' | 'lg';
	showName?: boolean;
	onClick?: () => void;
	className?: string;
}

export function UserAvatar({
	user,
	stravaId,
	size = 'md',
	showName = true,
	onClick,
	className
}: UserAvatarProps) {
	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-16 h-16'
	};

	const iconSizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-8 h-8'
	};

	const textSizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	};

	// No user data - show placeholder
	if (!user) {
		return (
			<div className={cn('flex items-center gap-3', className)}>
				<div
					className={cn(
						sizeClasses[size],
						'rounded-full bg-gray-500/20 border-2 border-gray-500/40 flex items-center justify-center'
					)}
				>
					<FontAwesomeIcon icon={faUser} className={cn(iconSizeClasses[size], 'text-gray-500')} />
				</div>
				{showName && (
					<span className={cn(textSizeClasses[size], 'font-bold text-gray-200')}>
						User #{stravaId}
					</span>
				)}
			</div>
		);
	}

	const displayName = user.stravaProfile?.firstname
		? user.stravaProfile.lastname
			? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname.charAt(0).toUpperCase()}.`
			: user.stravaProfile.firstname
		: `User ${user.stravaId}`;
	const imghexUrl = user.stravaProfile?.imghex;
	const profileUrl = user.stravaProfile?.profile;
	const imageUrl = imghexUrl || profileUrl;

	return (
		<div
			className={cn(
				'flex items-center gap-3',
				onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
				className
			)}
			onClick={onClick}
		>
			{imageUrl ? (
				<img
					src={imageUrl}
					alt={displayName}
					className={cn(
						sizeClasses[size],
						imghexUrl ? '' : 'rounded-full',
						'object-cover shadow-lg'
					)}
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = 'none';
						const fallback = (e.target as HTMLImageElement).nextElementSibling;
						if (fallback) (fallback as HTMLElement).style.display = 'flex';
					}}
				/>
			) : null}
			{imageUrl && (
				<div
					className={cn(
						sizeClasses[size],
						'rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg'
					)}
					style={{ display: imageUrl ? 'none' : 'flex' }}
				>
					<FontAwesomeIcon icon={faUser} className={cn(iconSizeClasses[size], 'text-orange-400')} />
				</div>
			)}
			{!imageUrl && (
				<div
					className={cn(
						sizeClasses[size],
						'rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg'
					)}
				>
					<FontAwesomeIcon icon={faUser} className={cn(iconSizeClasses[size], 'text-orange-400')} />
				</div>
			)}
			{showName && (
				<span className={cn(textSizeClasses[size], 'font-bold text-gray-100')}>{displayName}</span>
			)}
		</div>
	);
}
