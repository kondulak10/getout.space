import React, { Component, ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('❌ ErrorBoundary caught an error:', error);
		console.error('Component stack:', errorInfo.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center p-8">
						<div className="text-center">
							<p className="text-red-500 font-semibold mb-2">Something went wrong</p>
							<p className="text-gray-400 text-sm">{this.state.error?.message}</p>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
