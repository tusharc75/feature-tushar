import React from 'react'
import Typography from "@material-ui/core/Typography"

class ErrorBoundary extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
    }

    render() {
        if (this.state.errorInfo) {

            return (
                <div style={{ textAlign: 'center' }}>
                    <Typography style={{ fontWeight: 400 }} variant="h2" component="h2">Error</Typography>
                    <Typography variant="h4">Oops! Something went wrong. please try again</Typography>
                    <Typography variant="body1">
                        <details style={{ whiteSpace: 'pre-wrap' }}>
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo.componentStack}
                        </details>
                    </Typography>
                </div>
            );
        }

        return this.props.children;
    }
}
export default ErrorBoundary