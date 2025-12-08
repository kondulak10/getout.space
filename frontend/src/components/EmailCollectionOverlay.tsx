import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/pro-solid-svg-icons';
import { toast } from 'sonner';
import { UpdateEmailDocument, MeDocument } from '@/gql/graphql';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { analytics } from '@/lib/analytics';

// Email validation regex - matches backend validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailCollectionOverlayProps {
	onComplete: () => void;
}

export function EmailCollectionOverlay({ onComplete }: EmailCollectionOverlayProps) {
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);

	const [updateEmail, { loading }] = useMutation(UpdateEmailDocument, {
		refetchQueries: [{ query: MeDocument }],
		onCompleted: () => {
			analytics.track('email_submitted', {});
			toast.success('Email saved');
			onComplete();
		},
		onError: (err) => {
			// Extract error code from GraphQL errors (with type guard)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const graphQLErrors = 'graphQLErrors' in err ? (err as any).graphQLErrors : undefined;
			const errorCode = graphQLErrors?.[0]?.extensions?.code as string | undefined;

			if (errorCode === 'EMAIL_IN_USE') {
				setError('Email already in use');
			} else if (errorCode === 'INVALID_INPUT') {
				setError('Invalid email');
			} else {
				setError('Failed to save email');
			}
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!EMAIL_REGEX.test(email)) {
			setError('Invalid email');
			return;
		}

		await updateEmail({ variables: { email } });
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onComplete()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-orange-500" />
						Finish registration
					</DialogTitle>
				</DialogHeader>

				<DialogBody className="pt-2">
					<form onSubmit={handleSubmit} className="space-y-4">
						<p className="text-sm text-gray-400">
							Add your email to receive important updates only.
						</p>

						<div>
							<label htmlFor="email" className="block text-sm text-gray-400 mb-2">
								Email address
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="your@email.com"
								className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
								disabled={loading}
								required
								autoFocus
							/>
						</div>

						{error && (
							<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
								{error}
							</div>
						)}

						<div className="flex gap-3 pt-2">
							<Button
								type="submit"
								disabled={loading || !email}
								className="flex-1 bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
							>
								{loading ? 'Saving...' : 'Continue'}
							</Button>
						</div>
					</form>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
