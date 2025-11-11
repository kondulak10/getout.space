import { NotificationBell } from './NotificationBell';

interface NotificationDropdownProps {
	bellClassName?: string;
	iconClassName?: string;
	onClick: () => void;
	showLabel?: boolean;
}

export function NotificationDropdown({ bellClassName, iconClassName, onClick, showLabel = false }: NotificationDropdownProps) {
	return (
		<NotificationBell className={bellClassName} iconClassName={iconClassName} onClick={onClick} showLabel={showLabel} />
	);
}
