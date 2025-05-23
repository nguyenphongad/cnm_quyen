from django.db.models import Q, Count
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models.functions import ExtractMonth
from datetime import datetime
from .models import (
    Post, Activity, WorkSchedule, 
    ActivityRegistration, Notification, Permission,
    MemberAchievement, UnionFeeStatus, MemberActivity, MemberStatistics
)
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, 
    PostSerializer, ActivitySerializer, WorkScheduleSerializer,
    ActivityRegistrationSerializer, NotificationSerializer, PermissionSerializer,
    MemberAchievementSerializer, UnionFeeQuarterSerializer, MemberActivitySerializer,
    MemberStatisticsSerializer, MemberBookSerializer
)
from .permissions import (
    IsAdmin, IsCanBoDoan, IsAdminOrCanBoDoan, 
    IsDoanVien, IsOwnerOrAdminOrCanBoDoan, IsOwner
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'full_name', 'phone_number']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAdminOrCanBoDoan()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsOwnerOrAdminOrCanBoDoan()]
        elif self.action in ['list', 'search']:
            return [IsAdminOrCanBoDoan()]
        elif self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]
    
    @action(detail=False, methods=['get','patch','put'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        elif request.method in ['PATCH', 'PUT']:
            partial = request.method == 'PATCH'
            serializer = UserUpdateSerializer(request.user, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrCanBoDoan])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        users = self.queryset.filter(
            Q(username__icontains=query) | 
            Q(email__icontains=query) | 
            Q(full_name__icontains=query) |
            Q(phone_number__icontains=query)
        )
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdminOrCanBoDoan()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Lọc bài viết theo trạng thái
        status_filter = self.request.query_params.get('status')
        queryset = Post.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        # Ẩn các bài viết đã xóa trừ khi người dùng là Admin
        elif not (self.request.user.is_authenticated and self.request.user.role == 'ADMIN'):
            queryset = queryset.exclude(status='Deleted')
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        posts = Post.objects.filter(user=request.user)
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Lọc hoạt động theo trạng thái
        status = self.request.query_params.get('status', None)
        queryset = Activity.objects.all()
        
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Kiểm tra nếu có yêu cầu gửi thông báo
        send_notification = request.data.get('send_notification', 'false').lower() in ['true', '1', 'yes']
        if send_notification:
            activity = serializer.instance
            self.send_activity_notification(activity)
            
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Kiểm tra nếu có yêu cầu gửi thông báo
        send_notification = request.data.get('send_notification', 'false').lower() in ['true', '1', 'yes']
        if send_notification:
            self.send_activity_notification(instance)
            
        return Response(serializer.data)
    
    def send_activity_notification(self, activity):
        """Gửi thông báo về hoạt động mới tới tất cả đoàn viên"""
        try:
            # Tìm tất cả đoàn viên
            doan_vien_users = User.objects.filter(is_active=True)
            
            notification_content = f"Hoạt động mới: {activity.title}. Diễn ra vào {activity.start_date.strftime('%d/%m/%Y %H:%M')} tại {activity.location}. Hạn đăng ký: {activity.registration_deadline.strftime('%d/%m/%Y %H:%M') if activity.registration_deadline else 'Không có'}."
            
            # Tạo thông báo cho từng người dùng
            notifications = []
            for user in doan_vien_users:
                notifications.append(Notification(
                    user=user,
                    content=notification_content
                ))
            
            # Bulk create để tối ưu hiệu suất
            if notifications:
                Notification.objects.bulk_create(notifications)
                
            return True
        except Exception as e:
            print(f"Error sending activity notifications: {str(e)}")
            return False
    
    @action(detail=False, methods=['get'])
    def my_activities(self, request):
        activities = Activity.objects.filter(user=request.user)
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        activities = self.queryset.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query)
        )
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrCanBoDoan()])
    def registrations(self, request, pk=None):
        """
        Lấy danh sách đăng ký tham gia cho một hoạt động cụ thể
        """
        activity = self.get_object()
        registrations = ActivityRegistration.objects.filter(activity=activity)
        
        # Tùy chọn lọc theo trạng thái
        status = request.query_params.get('status', None)
        if status:
            registrations = registrations.filter(status=status)
            
        # Phân trang kết quả
        page = self.paginate_queryset(registrations)
        if page is not None:
            serializer = ActivityRegistrationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = ActivityRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def participants(self, request, pk=None):
        """
        Lấy danh sách người dùng đã đăng ký và được chấp nhận tham gia hoạt động
        """
        activity = self.get_object()
        
        # Lấy tất cả người dùng đã đăng ký và được chấp nhận (hoặc đã tham gia)
        registrations = ActivityRegistration.objects.filter(
            activity=activity,
            status__in=['Approved', 'Attended']
        )
        
        # Lấy thông tin người dùng từ các đăng ký
        users = [reg.user for reg in registrations]
        
        # Phân trang kết quả
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdminOrCanBoDoan()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Chỉ hiển thị lịch công tác của người dùng đang đăng nhập
        # hoặc tất cả nếu là admin hoặc cán bộ đoàn
        if self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
            return WorkSchedule.objects.all()
        return WorkSchedule.objects.filter(user=self.request.user)

class ActivityRegistrationViewSet(viewsets.ModelViewSet):
    queryset = ActivityRegistration.objects.all()
    serializer_class = ActivityRegistrationSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Mặc định chỉ hiển thị đăng ký của người dùng hiện tại
        # hoặc tất cả nếu là admin hoặc cán bộ đoàn
        if self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
            activity_id = self.request.query_params.get('activity')
            if activity_id:
                return ActivityRegistration.objects.filter(activity_id=activity_id)
            return ActivityRegistration.objects.all()
        return ActivityRegistration.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_registrations(self, request):
        registrations = ActivityRegistration.objects.filter(user=request.user)
        page = self.paginate_queryset(registrations)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(registrations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        registration = self.get_object()
        registration.status = 'Cancelled'
        registration.save()
        serializer = self.get_serializer(registration)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    
    def get_permissions(self):
        # Cho phép mọi người dùng đã xác thực đều có quyền truy cập
        # Admin và Cán bộ Đoàn có thể tạo, cập nhật và xóa thông báo
        if self.action in ['create', 'destroy']:
            return [IsAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Hiển thị thông báo của người dùng đang đăng nhập
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post', 'patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post', 'patch'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success'})

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    
    def get_permissions(self):
        return [IsAdmin()]
    
    def perform_create(self, serializer):
        serializer.save(granted_by=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics including total users, activities, posts and registrations
    """
    users_count = User.objects.count()
    activities_count = Activity.objects.count()
    posts_count = Post.objects.count()
    registrations_count = ActivityRegistration.objects.count()
    
    # Thống kê về hoạt động
    upcoming_activities = Activity.objects.filter(status='Upcoming').count()
    ongoing_activities = Activity.objects.filter(status='Ongoing').count()
    completed_activities = Activity.objects.filter(status='Completed').count()
    
    # Thống kê số người tham gia
    total_participants = ActivityRegistration.objects.filter(status='Registered').count()
    
    # Tính trung bình số người tham gia mỗi hoạt động
    average_participation = 0
    if activities_count > 0:
        average_participation = total_participants / activities_count
    
    # Dữ liệu phân loại hoạt động
    activity_by_type = []
    for activity_type, _ in Activity.TYPE_CHOICES:
        type_count = Activity.objects.filter(type=activity_type).count()
        if type_count > 0:
            activity_by_type.append({
                'type': activity_type,
                'count': type_count
            })
    
    return Response({
        'totalUsers': users_count,
        'totalActivities': activities_count,
        'totalPosts': posts_count,
        'registrations': registrations_count,
        
        # Thêm thống kê về hoạt động
        'activity_stats': {
            'total': activities_count,
            'upcoming': upcoming_activities,
            'ongoing': ongoing_activities,
            'completed': completed_activities,
            'participants': total_participants,
            'average': round(average_participation, 1),
            'by_type': activity_by_type
        }
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def participation_chart(request):
    """
    Get monthly participation data for dashboard chart
    """
    current_year = datetime.now().year
    
    # Get monthly registrations count for current year
    monthly_data = ActivityRegistration.objects.filter(
        registration_date__year=current_year,
        status='Registered'
    ).annotate(
        month=ExtractMonth('registration_date')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Prepare data for all months
    month_labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
    monthly_counts = [0] * 12
    
    for item in monthly_data:
        month_idx = item['month'] - 1  # Convert 1-based month to 0-based index
        monthly_counts[month_idx] = item['count']
    
    return Response({
        'labels': month_labels,
        'datasets': [
            {
                'label': 'Số lượng đoàn viên tham gia',
                'data': monthly_counts,
                'borderColor': '#3B82F6',
                'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                'fill': True
            }
        ]
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def activity_type_chart(request):
    """
    Endpoint to get data for the activity type chart
    Returns activity distribution by type for pie chart visualization
    """
    try:
        # Count activities by type
        activities_by_type = Activity.objects.values('type').annotate(count=Count('type')).order_by('-count')
        
        # Prepare data for chart
        labels = []
        data = []
        background_colors = [
            '#4F46E5', '#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6', 
            '#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#EF4444'
        ]
        
        for item in activities_by_type:
            activity_type = item['type'] or 'Không phân loại'
            labels.append(activity_type)
            data.append(item['count'])
        
        # Make sure we have enough colors (cycle through if needed)
        while len(background_colors) < len(labels):
            background_colors.extend(background_colors[:len(labels) - len(background_colors)])
        
        # Only use as many colors as we have data points
        background_colors = background_colors[:len(labels)]
        
        chart_data = {
            'labels': labels,
            'datasets': [
                {
                    'label': 'Số lượng hoạt động theo phân loại',
                    'data': data,
                    'backgroundColor': background_colors,
                    'borderWidth': 1
                }
            ]
        }
        
        return Response(chart_data)
    except Exception as e:
        return Response(
            {
                'error': f'Lỗi khi tạo biểu đồ phân loại hoạt động: {str(e)}',
                'labels': [],
                'datasets': []
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Thêm API cho chatbot RAG
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def chatbot_query(request):
    """
    Endpoint for chatbot RAG to answer questions about union activities and regulations
    """
    query = request.data.get('query', '')
    
    if not query:
        return Response(
            {'error': 'Vui lòng cung cấp câu hỏi.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Đây là phiên bản mẫu, trong thực tế bạn sẽ tích hợp với LLM và hệ thống RAG
    # Các câu trả lời mẫu dựa trên từ khóa trong câu hỏi
    query_lower = query.lower()
    
    if any(keyword in query_lower for keyword in ['giờ làm việc', 'thời gian làm việc', 'mở cửa']):
        response = {
            'answer': 'Văn phòng Đoàn trường mở cửa từ 8h00 đến 17h00 các ngày trong tuần từ thứ Hai đến thứ Sáu.',
            'sources': ['Quy định hoạt động của Đoàn trường, Điều 5, Khoản 2']
        }
    elif any(keyword in query_lower for keyword in ['đăng ký', 'tham gia', 'hoạt động']):
        response = {
            'answer': 'Để đăng ký tham gia hoạt động, bạn có thể vào mục "Hoạt động" trên thanh menu, chọn hoạt động muốn tham gia và nhấn nút "Đăng ký tham gia".',
            'sources': ['Hướng dẫn sử dụng hệ thống, Phần 3.2']
        }
    elif any(keyword in query_lower for keyword in ['điểm rèn luyện', 'đrl', 'điểm']):
        response = {
            'answer': 'Điểm rèn luyện từ hoạt động Đoàn sẽ được cập nhật vào cuối mỗi học kỳ. Mỗi hoạt động có mức điểm khác nhau tùy theo quy mô và tính chất. Để xem chi tiết điểm, vui lòng kiểm tra trong mục "Hồ sơ cá nhân".',
            'sources': ['Quy định về điểm rèn luyện, Điều 7', 'Quy chế đánh giá kết quả rèn luyện, Điều 12']
        }
    elif any(keyword in query_lower for keyword in ['xin nghỉ', 'vắng mặt', 'không tham gia']):
        response = {
            'answer': 'Để xin nghỉ một hoạt động đã đăng ký, bạn cần gửi đơn xin phép đến cán bộ Đoàn phụ trách hoạt động ít nhất 24 giờ trước khi hoạt động diễn ra. Trong trường hợp khẩn cấp, có thể liên hệ trực tiếp qua số điện thoại của văn phòng Đoàn.',
            'sources': ['Quy định tham gia hoạt động Đoàn, Điều 8, Khoản 3']
        }
    elif any(keyword in query_lower for keyword in ['chứng nhận', 'xác nhận', 'giấy xác nhận']):
        response = {
            'answer': 'Để yêu cầu giấy chứng nhận tham gia hoạt động, bạn cần liên hệ văn phòng Đoàn trường với thông tin hoạt động cụ thể và lý do xin cấp giấy chứng nhận. Thời gian xử lý yêu cầu từ 3-5 ngày làm việc.',
            'sources': ['Quy trình cấp giấy chứng nhận hoạt động, Điều 4']
        }
    elif any(keyword in query_lower for keyword in ['chuyển sinh hoạt', 'chuyển đoàn']):
        response = {
            'answer': 'Để chuyển sinh hoạt Đoàn, bạn cần làm thủ tục tại văn phòng Đoàn trường với các giấy tờ: (1) Đơn xin chuyển sinh hoạt, (2) Sổ đoàn viên, (3) Giấy giới thiệu của chi đoàn. Thời gian xử lý từ 5-7 ngày làm việc.',
            'sources': ['Hướng dẫn chuyển sinh hoạt Đoàn, Mục II, Điểm 2']
        }
    elif any(keyword in query_lower for keyword in ['đoàn phí', 'nộp tiền', 'đóng phí']):
        response = {
            'answer': 'Đoàn phí được đóng mỗi năm một lần vào đầu năm học hoặc theo quy định của chi đoàn. Mức đoàn phí hiện tại là 50.000 đồng/năm. Việc đóng đoàn phí là trách nhiệm bắt buộc của mỗi đoàn viên.',
            'sources': ['Điều lệ Đoàn TNCS Hồ Chí Minh, Chương III, Điều 5', 'Quy định nội bộ của Đoàn trường']
        }
    else:
        response = {
            'answer': 'Cảm ơn câu hỏi của bạn. Để có thông tin chi tiết nhất, vui lòng liên hệ văn phòng Đoàn trường qua số điện thoại 0123.456.789 hoặc email doankhoa@example.edu.vn, hoặc kiểm tra mục "Tài liệu - Quy định" trên trang web.',
            'sources': ['Thông tin liên hệ Đoàn trường']
        }
    
    return Response(response)

# API lấy dữ liệu về đoàn trường
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def union_info(request):
    """
    Get information about the Students' Union
    """
    return Response({
        'name': 'Đoàn Thanh niên Trường Đại học ABC',
        'description': 'Đoàn TNCS Hồ Chí Minh Trường Đại học ABC là tổ chức chính trị - xã hội của thanh niên trong trường, hoạt động dưới sự lãnh đạo trực tiếp của Đảng ủy nhà trường.',
        'established': '1975-05-15',
        'mission': [
            'Đoàn kết, tập hợp thanh niên trong trường',
            'Giáo dục lý tưởng cách mạng, đạo đức, lối sống văn hóa cho thanh niên',
            'Chăm lo và bảo vệ quyền lợi chính đáng của thanh niên',
            'Phát huy vai trò xung kích, sáng tạo của thanh niên trong học tập, nghiên cứu khoa học'
        ],
        'structure': [
            {
                'name': 'Ban Chấp hành Đoàn trường',
                'description': 'Cơ quan lãnh đạo cao nhất của Đoàn trường giữa hai kỳ đại hội'
            },
            {
                'name': 'Ban Thường vụ Đoàn trường',
                'description': 'Cơ quan thường trực của Ban Chấp hành'
            },
            {
                'name': 'Các ban chuyên môn',
                'description': 'Gồm Ban Tổ chức, Ban Tuyên giáo, Ban Học tập, Ban Phong trào, Ban Hậu cần'
            },
            {
                'name': 'Liên chi đoàn Khoa',
                'description': 'Tổ chức đoàn ở cấp khoa'
            },
            {
                'name': 'Chi đoàn',
                'description': 'Tổ chức cơ sở của Đoàn ở các lớp'
            }
        ],
        'regulations_summary': 'Đoàn viên có trách nhiệm tham gia sinh hoạt chi đoàn định kỳ, đóng đoàn phí đầy đủ, thực hiện nghiêm túc điều lệ Đoàn và các nghị quyết của Đoàn các cấp.',
        'contact': {
            'address': 'Phòng A123, Khu A, Trường Đại học ABC',
            'phone': '0123.456.789',
            'email': 'doankhoa@example.edu.vn',
            'facebook': 'facebook.com/doantruongabc'
        }
    })

# Viewset cho thành tích đoàn viên
class MemberAchievementViewSet(viewsets.ModelViewSet):
    serializer_class = MemberAchievementSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id and (self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']):
            return MemberAchievement.objects.filter(user_id=user_id)
        return MemberAchievement.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        if user_id and (self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']):
            user = User.objects.get(id=user_id)
            serializer.save(user=user)
        else:
            serializer.save(user=self.request.user)

# Viewset cho đoàn phí
class UnionFeeStatusViewSet(viewsets.ModelViewSet):
    serializer_class = UnionFeeQuarterSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        year = self.request.query_params.get('year')
        queryset = UnionFeeStatus.objects.all()
        
        if user_id and (self.request.user.role in ['ADMIN', 'CAN_BO_DOAN'] or int(user_id) == self.request.user.id):
            queryset = queryset.filter(user_id=user_id)
        else:
            queryset = queryset.filter(user=self.request.user)
        
        if year:
            queryset = queryset.filter(year=year)
            
        return queryset
    
    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        if user_id and (self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']):
            user = User.objects.get(id=user_id)
            serializer.save(user=user)
        else:
            serializer.save(user=self.request.user)

# Viewset cho hoạt động đoàn viên
class MemberActivityViewSet(viewsets.ModelViewSet):
    serializer_class = MemberActivitySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrCanBoDoan()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id and (self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']):
            return MemberActivity.objects.filter(user_id=user_id)
        return MemberActivity.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        if user_id and (self.request.user.role in ['ADMIN', 'CAN_BO_DOAN']):
            user = User.objects.get(id=user_id)
            serializer.save(user=user)
        else:
            serializer.save(user=self.request.user)

# API endpoint cho sổ đoàn viên
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def member_book(request):
    user_id = request.query_params.get('user_id')
    
    if user_id and request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = request.user
    
    # Đảm bảo user có dữ liệu thống kê
    stats, created = MemberStatistics.objects.get_or_create(user=user)
    
    if created:
        # Tính toán các thống kê nếu vừa tạo mới
        member_activities = MemberActivity.objects.filter(user=user)
        stats.total_activities = member_activities.count()
        stats.total_points = sum(activity.points for activity in member_activities)
        stats.attendance_rate = 92  # Giá trị mặc định hoặc tính toán từ dữ liệu thực tế
        stats.rank = "Xuất sắc" if stats.total_points > 50 else "Khá" if stats.total_points > 30 else "Trung bình"
        stats.save()
    
    serializer = MemberBookSerializer(user)
    return Response(serializer.data)

# API endpoint cho hoạt động đoàn viên
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def member_activities(request):
    user_id = request.query_params.get('user_id')
    
    if user_id and request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
        activities = MemberActivity.objects.filter(user_id=user_id)
    else:
        activities = MemberActivity.objects.filter(user=request.user)
    
    serializer = MemberActivitySerializer(activities, many=True)
    return Response(serializer.data)

# API endpoint cho thành tích đoàn viên
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def member_achievements(request):
    user_id = request.query_params.get('user_id')
    
    if user_id and request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
        achievements = MemberAchievement.objects.filter(user_id=user_id)
    else:
        achievements = MemberAchievement.objects.filter(user=request.user)
    
    serializer = MemberAchievementSerializer(achievements, many=True)
    return Response(serializer.data)

# API endpoint cho đoàn phí
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def member_fee_status(request):
    user_id = request.query_params.get('user_id')
    
    if user_id and request.user.role in ['ADMIN', 'CAN_BO_DOAN']:
        user = User.objects.get(id=user_id)
    else:
        user = request.user
    
    result = []
    years = UnionFeeStatus.objects.filter(user=user).values_list('year', flat=True).distinct()
    
    for year in years:
        quarters = UnionFeeStatus.objects.filter(user=user, year=year)
        serializer = UnionFeeQuarterSerializer(quarters, many=True)
        result.append({
            'year': year,
            'quarters': serializer.data
        })
    
    return Response(result)

# Các API endpoint cho báo cáo
@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def get_report_dashboard(request):
    """
    Lấy dữ liệu tổng quan cho báo cáo dashboard
    """
    # Thống kê số lượng người dùng theo vai trò
    user_stats = User.objects.values('role').annotate(count=Count('id'))
    
    # Thống kê hoạt động
    activity_stats = {
        'total': Activity.objects.count(),
        'completed': Activity.objects.filter(status='Completed').count(),
        'ongoing': Activity.objects.filter(status='Published').count(),
        'upcoming': Activity.objects.filter(status='Draft').count()
    }
    
    # Thống kê đăng ký hoạt động
    registration_stats = {
        'total': ActivityRegistration.objects.count(),
        'completed': ActivityRegistration.objects.filter(status='Completed').count(),
        'cancelled': ActivityRegistration.objects.filter(status='Cancelled').count()
    }
    
    return Response({
        'user_stats': user_stats,
        'activity_stats': activity_stats,
        'registration_stats': registration_stats
    })

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def get_report_activities(request):
    """
    Lấy dữ liệu báo cáo về hoạt động
    """
    # Lấy thông tin chi tiết các hoạt động
    activities = Activity.objects.all().order_by('-start_time')
    serializer = ActivitySerializer(activities, many=True)
    
    # Thống kê số lượng đăng ký theo hoạt động
    registration_counts = ActivityRegistration.objects.values('activity').annotate(count=Count('id'))
    
    return Response({
        'activities': serializer.data,
        'registration_counts': registration_counts
    })

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def get_report_members(request):
    """
    Lấy dữ liệu báo cáo về đoàn viên
    """
    # Lấy thông tin đoàn viên
    members = User.objects.filter(role='DOAN_VIEN')
    serializer = UserSerializer(members, many=True)
    
    # Thống kê tham gia hoạt động
    member_participation = ActivityRegistration.objects.values('user').annotate(count=Count('id'))
    
    return Response({
        'members': serializer.data,
        'member_participation': member_participation
    })

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def get_activities_by_month(request):
    """
    Lấy dữ liệu hoạt động theo tháng
    """
    current_year = datetime.now().year
    
    # Lấy số lượng hoạt động theo tháng
    activities_by_month = Activity.objects.filter(
        start_time__year=current_year
    ).annotate(
        month=ExtractMonth('start_time')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    return Response(activities_by_month)

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def get_participation_by_month(request):
    """
    Lấy dữ liệu tham gia hoạt động theo tháng
    """
    current_year = datetime.now().year
    
    # Lấy số lượng đăng ký hoạt động theo tháng
    participation_by_month = ActivityRegistration.objects.filter(
        registration_date__year=current_year
    ).annotate(
        month=ExtractMonth('registration_date')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    return Response(participation_by_month)

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def get_activity_types(request):
    """
    Lấy dữ liệu về loại hoạt động
    """
    # Sử dụng cùng logic với activity_type_chart nhưng trả về dữ liệu đầy đủ hơn
    activity_types = {
        'Học tập': Q(title__icontains='học tập') | Q(description__icontains='học tập'),
        'Tình nguyện': Q(title__icontains='tình nguyện') | Q(description__icontains='tình nguyện'),
        'Văn hóa': Q(title__icontains='văn hóa') | Q(description__icontains='văn hóa'),
        'Thể thao': Q(title__icontains='thể thao') | Q(description__icontains='thể thao'),
        'Khác': ~(Q(title__icontains='học tập') | Q(description__icontains='học tập') |
                 Q(title__icontains='tình nguyện') | Q(description__icontains='tình nguyện') |
                 Q(title__icontains='văn hóa') | Q(description__icontains='văn hóa') |
                 Q(title__icontains='thể thao') | Q(description__icontains='thể thao'))
    }
    
    result = []
    
    for type_name, query in activity_types.items():
        activities = Activity.objects.filter(query)
        count = activities.count()
        result.append({
            'type': type_name,
            'count': count,
            'activities': [a.id for a in activities]
        })
    
    return Response(result)

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def download_report(request):
    """
    Tải xuống báo cáo dưới dạng PDF hoặc Excel
    """
    report_type = request.query_params.get('type', 'dashboard')
    file_format = request.query_params.get('format', 'pdf')
    
    # Triển khai tạo báo cáo PDF hoặc Excel tại đây
    # Đây là phiên bản mẫu, trả về thông báo
    return Response({
        "message": f"Chức năng tải báo cáo {report_type} định dạng {file_format} đang được phát triển"
    })

@api_view(['GET'])
@permission_classes([IsAdminOrCanBoDoan])
def member_stats(request):
    """
    Get member statistics for the members management page
    """
    # Tổng số thành viên và trạng thái hoạt động
    total_members = User.objects.filter(role='DOAN_VIEN').count()
    active_members = User.objects.filter(role='DOAN_VIEN', is_active=True).count()
    inactive_members = total_members - active_members
    
    # Thành viên mới trong tháng hiện tại
    current_month = datetime.now().month
    current_year = datetime.now().year
    new_members_this_month = User.objects.filter(
        role='DOAN_VIEN',
        date_joined__month=current_month,
        date_joined__year=current_year
    ).count()
    
    # Thống kê theo vai trò
    members_by_role = []
    for role, role_name in User.ROLE_CHOICES:
        role_count = User.objects.filter(role=role).count()
        members_by_role.append({
            'role': role,
            'count': role_count
        })
    
    # Thống kê theo khoa/ban
    departments = User.objects.filter(role='DOAN_VIEN').values('department').annotate(
        count=Count('id')
    ).order_by('department')
    
    members_by_department = []
    for dept in departments:
        if dept['department']:  # Chỉ đếm nếu department không phải None hoặc trống
            members_by_department.append({
                'department': dept['department'],
                'count': dept['count']
            })
    
    return Response({
        'totalMembers': total_members,
        'activeMembers': active_members,
        'inactiveMembers': inactive_members,
        'newMembersThisMonth': new_members_this_month,
        'membersByRole': members_by_role,
        'membersByDepartment': members_by_department
    }) 