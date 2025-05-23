from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Activity, ActivityRegistration
from core.serializers import ActivitySerializer, ActivityRegistrationSerializer
from django.db.models import Count, Sum, F, Q
from django.utils import timezone

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Activity.objects.all()
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by type
        activity_type = self.request.query_params.get('type', None)
        if activity_type:
            queryset = queryset.filter(type=activity_type)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(description__icontains=search)
        
        # Only activities created by the current user
        my_activities = self.request.query_params.get('my_activities', False)
        if my_activities and my_activities.lower() == 'true':
            queryset = queryset.filter(created_by=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        activity = self.get_object()
        
        # Ghi log để debug
        print(f"Request data: {request.data}")
        print(f"User: {request.user}")
        print(f"Activity: {activity}")
        
        # Check if user already registered
        existing_registration = ActivityRegistration.objects.filter(
            activity=activity,
            user=request.user
        ).first()
        
        if existing_registration:
            print(f"Existing registration found: {existing_registration.status}")
            # Kiểm tra cả hai định dạng string của status để tránh lỗi
            if existing_registration.status == 'Cancelled' or existing_registration.status.lower() == 'cancelled':
                # Reactivate registration
                existing_registration.status = 'Pending'
                existing_registration.save()
                return Response({'detail': 'Registration reactivated successfully'}, status=status.HTTP_200_OK)
            
            # Đã đăng ký trước đó nhưng không phải trạng thái "Cancelled" - trả về thông báo
            return Response({
                'detail': f'You are already registered for this activity (status: {existing_registration.status})',
                'status': existing_registration.status,
                'registration_id': existing_registration.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if registration deadline passed
        if activity.registration_deadline and timezone.now() > activity.registration_deadline:
            print(f"Registration deadline passed: {activity.registration_deadline} vs {timezone.now()}")
            return Response({'detail': 'Registration deadline has passed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if activity is full
        current_participants = ActivityRegistration.objects.filter(activity=activity, status__in=['Approved', 'Attended']).count()
        print(f"Current participants: {current_participants}, Max participants: {activity.max_participants}")
        if activity.max_participants and current_participants >= activity.max_participants:
            return Response({'detail': 'Activity is at maximum capacity'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get additional registration data from request
            reason = request.data.get('reason', '')
            phone_number = request.data.get('phoneNumber', '')
            emergency_contact = request.data.get('emergencyContact', '')
            dietary_requirements = request.data.get('dietaryRequirements', '')
            additional_info = request.data.get('additionalInfo', '')
            
            # Prepare notes for backwards compatibility
            notes = ""
            if reason:
                notes += f"Lý do tham gia: {reason}\n"
            if phone_number:
                notes += f"Số điện thoại: {phone_number}\n"
            if emergency_contact:
                notes += f"Liên hệ khẩn cấp: {emergency_contact}\n"
            if dietary_requirements:
                notes += f"Yêu cầu đặc biệt: {dietary_requirements}\n"
            if additional_info:
                notes += f"Thông tin bổ sung: {additional_info}\n"
            
            # Save user's phone number to their profile if provided
            if phone_number and (not request.user.phone_number or request.user.phone_number != phone_number):
                request.user.phone_number = phone_number
                request.user.save(update_fields=['phone_number'])
            
            # Create new registration with all the information
            registration = ActivityRegistration.objects.create(
                activity=activity,
                user=request.user,
                status='Pending',  # Set to Pending instead of REGISTERED for approval workflow
                notes=notes,
                reason=reason,
                phone_number=phone_number,
                emergency_contact=emergency_contact,
                dietary_requirements=dietary_requirements,
                additional_info=additional_info
            )
            
            print(f"Registration created successfully: {registration.id}")
            
            # Create notification for admin/can bo doan about new registration
            from core.models import Notification, User
            admin_users = User.objects.filter(role__in=['ADMIN', 'CAN_BO_DOAN'])
            
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    content=f"Đoàn viên {request.user.full_name} đã đăng ký tham gia hoạt động '{activity.title}'. Vui lòng xét duyệt."
                )
            
            # Create notification for the user
            Notification.objects.create(
                user=request.user,
                content=f"Bạn đã đăng ký tham gia hoạt động '{activity.title}'. Đăng ký của bạn đang chờ xét duyệt."
            )
            
            serializer = ActivityRegistrationSerializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error creating registration: {str(e)}")
            return Response({'detail': f'Error creating registration: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel_registration(self, request, pk=None):
        activity = self.get_object()
        
        # Find user's registration
        registration = ActivityRegistration.objects.filter(
            activity=activity,
            user=request.user
        ).first()
        
        if not registration:
            return Response({'detail': 'You are not registered for this activity'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Cancel registration - Current status: {registration.status}")
        
        # Kiểm tra nếu đã hủy rồi
        if registration.status == 'Cancelled' or registration.status.lower() == 'cancelled':
            return Response({'detail': 'Registration already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Chỉ cho phép hủy khi đang ở trạng thái Pending hoặc Approved
        if registration.status not in ['Pending', 'Approved']:
            return Response({'detail': f'Cannot cancel registration with status: {registration.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancel registration
        registration.status = 'Cancelled'
        registration.save()
        
        # Create notification for the user
        from core.models import Notification
        Notification.objects.create(
            user=request.user,
            content=f"Bạn đã hủy đăng ký tham gia hoạt động '{activity.title}'."
        )
        
        # Create notification for admin/can bo doan about cancellation
        from core.models import User
        admin_users = User.objects.filter(role__in=['ADMIN', 'CAN_BO_DOAN'])
        
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                content=f"Đoàn viên {request.user.full_name} đã hủy đăng ký tham gia hoạt động '{activity.title}'."
            )
        
        return Response({'detail': 'Registration cancelled successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        activity = self.get_object()
        registrations = ActivityRegistration.objects.filter(activity=activity)
        
        page = self.paginate_queryset(registrations)
        if page is not None:
            serializer = ActivityRegistrationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ActivityRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        activity = self.get_object()
        user_id = request.data.get('user_id')
        attended = request.data.get('attended', False)
        
        if not user_id:
            return Response({'detail': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the registration
        registration = ActivityRegistration.objects.filter(
            activity=activity,
            user_id=user_id
        ).first()
        
        if not registration:
            return Response({'detail': 'User is not registered for this activity'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update attendance
        if attended:
            registration.status = 'Attended'
            registration.attendance_date = timezone.now()
        registration.save()
        
        serializer = ActivityRegistrationSerializer(registration)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = Activity.objects.count()
        upcoming = Activity.objects.filter(start_date__gt=timezone.now()).count()
        ongoing = Activity.objects.filter(start_date__lte=timezone.now(), end_date__gte=timezone.now()).count()
        completed = Activity.objects.filter(end_date__lt=timezone.now()).count()
        
        # Calculate participation stats
        total_participants = ActivityRegistration.objects.filter(status__in=['Approved', 'Attended']).count()
        average_participation = total_participants / total if total > 0 else 0
        
        # Get activity counts by type
        activity_by_type = Activity.objects.values('type').annotate(count=Count('id'))
        
        return Response({
            'totalActivities': total,
            'upcomingActivities': upcoming,
            'ongoingActivities': ongoing,
            'completedActivities': completed,
            'totalParticipants': total_participants,
            'averageParticipation': average_participation,
            'activityByType': [{'type': item['type'], 'count': item['count']} for item in activity_by_type]
        })

    @action(detail=True, methods=['get'], url_path='registration-status')
    def registration_status(self, request, pk=None):
        activity = self.get_object()
        
        # Tìm đăng ký của người dùng hiện tại cho hoạt động này
        registration = ActivityRegistration.objects.filter(
            activity=activity,
            user=request.user
        ).first()
        
        if not registration:
            # Nếu không tìm thấy đăng ký, trả về thông báo không đăng ký
            return Response({
                'registered': False,
                'detail': 'User has not registered for this activity'
            }, status=status.HTTP_200_OK)
        
        # Nếu tìm thấy đăng ký, trả về thông tin trạng thái
        return Response({
            'registered': True,
            'registration_id': registration.id,
            'status': registration.status,
            'registration_date': registration.registration_date,
            'attendance_date': registration.attendance_date,
            'notes': registration.notes
        }, status=status.HTTP_200_OK)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        # Get counts
        total_activities = Activity.objects.count()
        recent_activities = Activity.objects.order_by('-start_date')[:5]
        
        # Get upcoming deadlines
        upcoming_deadlines = Activity.objects.filter(
            registration_deadline__gte=timezone.now()
        ).order_by('registration_deadline')[:5]
        
        return Response({
            'totalMembers': 0,  # Placeholder, should fetch from user model
            'totalActivities': total_activities,
            'totalPosts': 0,    # Placeholder, should fetch from post model
            'totalNotifications': 0,  # Placeholder, should fetch from notification model
            'recentActivities': ActivitySerializer(recent_activities, many=True).data,
            'upcomingDeadlines': [
                {
                    'id': activity.id,
                    'title': activity.title,
                    'deadline': activity.registration_deadline,
                    'type': activity.type
                } for activity in upcoming_deadlines
            ]
        })
    
    @action(detail=False, methods=['get'])
    def participation_chart(self, request):
        time_range = request.query_params.get('time_range', 'month')
        
        # Get current date
        now = timezone.now()
        
        if time_range == 'week':
            # Get participation data for the past 7 days
            labels = [(now - timezone.timedelta(days=i)).strftime('%a') for i in range(6, -1, -1)]
            data = []
            
            for i in range(6, -1, -1):
                date = now - timezone.timedelta(days=i)
                count = ActivityRegistration.objects.filter(
                    registration_date__date=date.date()
                ).count()
                data.append(count)
            
        elif time_range == 'year':
            # Get participation data for the past 12 months
            labels = []
            data = []
            
            for i in range(11, -1, -1):
                month_start = (now - timezone.timedelta(days=30*i)).replace(day=1)
                month_name = month_start.strftime('%b')
                labels.append(month_name)
                
                # Count registrations for this month
                next_month = month_start.replace(month=month_start.month+1) if month_start.month < 12 else month_start.replace(year=month_start.year+1, month=1)
                count = ActivityRegistration.objects.filter(
                    registration_date__gte=month_start,
                    registration_date__lt=next_month
                ).count()
                data.append(count)
        
        else:  # Default to month
            # Get participation data for the past 30 days
            labels = []
            data = []
            
            for i in range(29, -1, -1):
                date = now - timezone.timedelta(days=i)
                labels.append(date.strftime('%d %b'))
                
                count = ActivityRegistration.objects.filter(
                    registration_date__date=date.date()
                ).count()
                data.append(count)
        
        return Response({
            'labels': labels,
            'datasets': [
                {
                    'label': 'Số lượng đăng ký',
                    'data': data,
                    'borderColor': '#3B82F6',
                    'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                }
            ]
        })
    
    @action(detail=False, methods=['get'])
    def activity_type_chart(self, request):
        # Get activity counts by type
        activity_by_type = Activity.objects.values('type').annotate(count=Count('id'))
        
        labels = []
        data = []
        backgroundColor = [
            'rgba(59, 130, 246, 0.7)',  # Blue
            'rgba(16, 185, 129, 0.7)',  # Green
            'rgba(245, 158, 11, 0.7)',  # Yellow
            'rgba(239, 68, 68, 0.7)',   # Red
            'rgba(139, 92, 246, 0.7)',  # Purple
            'rgba(20, 184, 166, 0.7)',  # Teal
            'rgba(249, 115, 22, 0.7)',  # Orange
            'rgba(236, 72, 153, 0.7)'   # Pink
        ]
        
        for i, item in enumerate(activity_by_type):
            labels.append(item['type'])
            data.append(item['count'])
        
        return Response({
            'labels': labels,
            'datasets': [
                {
                    'label': 'Số lượng hoạt động',
                    'data': data,
                    'backgroundColor': backgroundColor[:len(data)],
                    'borderWidth': 0
                }
            ]
        }) 