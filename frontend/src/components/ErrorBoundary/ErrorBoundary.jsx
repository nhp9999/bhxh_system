import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../UI';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Gửi log error tới service
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

const ErrorFallback = ({ error }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Đã xảy ra lỗi
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {error?.message || 'Vui lòng thử lại sau'}
                    </p>
                </div>
                <div className="flex justify-center space-x-4">
                    <Button onClick={() => window.location.reload()}>
                        Tải lại trang
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary; 