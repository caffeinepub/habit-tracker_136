import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
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

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            padding: "24px",
            background:
              "linear-gradient(135deg, oklch(0.96 0.055 160) 0%, oklch(0.96 0.045 300) 35%, oklch(0.97 0.04 60) 70%, oklch(0.96 0.05 200) 100%)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "40px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(140,120,200,0.15)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>😞</div>
            <h2
              style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}
            >
              Something went wrong
            </h2>
            <p
              style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}
            >
              The app ran into an error. Please refresh and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px",
                borderRadius: "999px",
                background: "#1a1a2e",
                color: "white",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
