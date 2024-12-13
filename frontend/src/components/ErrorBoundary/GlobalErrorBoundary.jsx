import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../UI';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Gửi log error tới service monitoring (ví dụ: Sentry)
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
        }

        return this.props.children;
    }
}

const ErrorFallback = ({ error, onReset }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full px-4 py-8 bg-white shadow-lg rounded-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                        Đã xảy ra lỗi
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.'}
                    </p>
                    <div className="space-x-4">
                        <Button onClick={() => window.location.reload()}>
                            Tải lại trang
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/')}>
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalErrorBoundary; 