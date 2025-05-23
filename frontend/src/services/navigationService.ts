import { NavigateFunction } from 'react-router-dom';

let navigateRef: NavigateFunction | null = null;

export const setNavigate = (navigate: NavigateFunction) => {
    navigateRef = navigate;
};

export const navigateTo = (path: string, options?: { replace?: boolean }) => {
    if (navigateRef) {
        navigateRef(path, options);
    } else {
        // Fallback nếu navigate chưa sẵn sàng
        console.warn('Navigate chưa được khởi tạo, sử dụng window.location thay thế');
        if (options?.replace) {
            window.location.replace(path);
        } else {
            window.location.href = path;
        }
    }
};