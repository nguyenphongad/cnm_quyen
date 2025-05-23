from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Cho phép truy cập chỉ khi người dùng là Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class IsCanBoDoan(permissions.BasePermission):
    """
    Cho phép truy cập chỉ khi người dùng là Cán bộ đoàn.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'CAN_BO_DOAN'

class IsAdminOrCanBoDoan(permissions.BasePermission):
    """
    Cho phép truy cập khi người dùng là Admin hoặc Cán bộ đoàn.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'CAN_BO_DOAN']

class IsDoanVien(permissions.BasePermission):
    """
    Cho phép truy cập chỉ khi người dùng là Đoàn viên.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'DOAN_VIEN'

class IsOwnerOrAdminOrCanBoDoan(permissions.BasePermission):
    """
    Cho phép truy cập object chỉ khi người dùng là chủ sở hữu, Admin hoặc Cán bộ đoàn.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Admin và Cán bộ đoàn có thể truy cập mọi đối tượng
        if request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
            return True
            
        # Kiểm tra chủ sở hữu
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Trường hợp cho model User
        elif hasattr(obj, 'id'):
            return obj.id == request.user.id
            
        return False

class IsOwner(permissions.BasePermission):
    """
    Cho phép truy cập object chỉ khi người dùng là chủ sở hữu.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Trường hợp cho model User
        elif hasattr(obj, 'id'):
            return obj.id == request.user.id
            
        return False

class ReadOnly(permissions.BasePermission):
    """
    Cho phép truy cập chỉ với các request GET, HEAD hoặc OPTIONS.
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS 