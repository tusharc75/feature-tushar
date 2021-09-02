import React from 'react'
import {Typography , Button} from "@material-ui/core";
import styles from "./error.module.scss";
import errorImage from "./assets/line-item.png";

class ErrorBoundary extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    componentDidCatch(error, errorInfo) {
        if (process.env.REACT_APP_ENV !== 'local') {
            if (error instanceof TypeError || error instanceof ReferenceError) {
                this.setState({
                    error: error,
                    errorInfo: errorInfo
                })
            }
        }
        else {
            this.setState({
                error: error,
                errorInfo: errorInfo
            })
        }
    }

    render() {
        if (this.state.errorInfo) {

            return (
                <div className={styles.main}>
                <div style={{ textAlign: 'center' }} className={styles.submain}>
                  <div className={styles.vector}>
                    <img src={errorImage} />
                  </div>
                  <Typography style={{ fontWeight: 600 }} variant="h2" component="h2" className={styles.error}>
                    Something went wrong!
                  </Typography>
                  <Typography variant="h4" className={styles.message}>
                    Our team has been notified.If the problem persists, please contact eQuip-T Support.
                  </Typography>
                  <Button variant="contained" color="primary" className={styles.reload}>
                    Try again 
                  </Button>
                  <Typography variant="body1">
                    <details style={{ whiteSpace: 'pre-wrap' }} className={styles.detailScreen}>
                      {this.state.error && this.state.error.toString()}
                      <br />
                      {this.state.errorInfo.componentStack}
                    </details>
                  </Typography>
                </div>
              </div>
            );
        }

        return this.props.children;
    }
}
export default ErrorBoundary