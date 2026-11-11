import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback(reset: () => void): ReactNode;
}

/** Last line of defence: a render error shows a recoverable message instead of a blank page. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack);
  }

  reset = () => this.setState({ failed: false });

  override render() {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children;
  }
}
