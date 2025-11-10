import { NotificationBell } from './NotificationBell';

interface NotificationDropdownProps {
	bellClassName?: string;
	iconClassName?: string;
	onClick: () => void;
}

export function NotificationDropdown({ bellClassName, iconClassName, onClick }: NotificationDropdownProps) {
	return (
		<NotificationBell className={bellClassName} iconClassName={iconClassName} onClick={onClick} />
	);
}
