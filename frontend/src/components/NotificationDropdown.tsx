import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { NotificationBell } from './NotificationBell';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/contexts/NotificationProvider';

export function NotificationDropdown() {
	const { notifications, loading, unreadCount, markAllAsRead } = useNotifications();
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu.Root open={open} onOpenChange={setOpen}>
			<DropdownMenu.Trigger asChild>
				<div>
					<NotificationBell />
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg w-96 max-h-[500px] overflow-y-auto z-50"
					align="end"
					sideOffset={5}
				>
					<div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900">
						<h3 className="font-semibold text-white">Notifications</h3>
						{unreadCount > 0 && (
							<button
								onClick={markAllAsRead}
								className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
							>
								Mark all as read
							</button>
						)}
					</div>

					{loading ? (
						<div className="p-4 text-center text-gray-400">Loading...</div>
					) : notifications.length === 0 ? (
						<div className="p-8 text-center text-gray-400">No notifications yet</div>
					) : (
						<div>
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onClose={() => setOpen(false)}
								/>
							))}
						</div>
					)}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
