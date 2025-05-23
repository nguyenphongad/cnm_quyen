from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    UserViewSet, PostViewSet, ActivityViewSet, 
    WorkScheduleViewSet, ActivityRegistrationViewSet, 
    NotificationViewSet, PermissionViewSet,
    dashboard_stats, participation_chart, activity_type_chart,
    chatbot_query, union_info,
    MemberAchievementViewSet, UnionFeeStatusViewSet, MemberActivityViewSet,
    member_book, member_activities, member_achievements, member_fee_status,
    get_report_dashboard, get_report_activities, get_report_members,
    get_activities_by_month, get_participation_by_month, get_activity_types,
    download_report, member_stats
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'work-schedules', WorkScheduleViewSet, basename='work-schedule')
router.register(r'activity-registrations', ActivityRegistrationViewSet, basename='activity-registration')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'permissions', PermissionViewSet, basename='permission')

# Đăng ký router cho sổ đoàn viên
router.register(r'member-achievements', MemberAchievementViewSet, basename='member-achievement')
router.register(r'union-fee-status', UnionFeeStatusViewSet, basename='union-fee-status')
router.register(r'member-activities', MemberActivityViewSet, basename='member-activity')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Dashboard API endpoints
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/participation-chart/', participation_chart, name='participation-chart'),
    path('dashboard/activity-type-chart/', activity_type_chart, name='activity-type-chart'),
    path('dashboard/member-stats/', member_stats, name='member-stats'),
    
    # Chatbot and Union Info API endpoints
    path('chatbot/query/', chatbot_query, name='chatbot-query'),
    path('union/info/', union_info, name='union-info'),
    
    # Sổ đoàn viên API
    path('member-book/', member_book, name='member-book'),
    path('member-activities/', member_activities, name='member-activities'),
    path('member-achievements/', member_achievements, name='member-achievements'),
    path('member-fee-status/', member_fee_status, name='member-fee-status'),
    
    # Reports API endpoints
    path('reports/dashboard/', get_report_dashboard, name='report-dashboard'),
    path('reports/activities/', get_report_activities, name='report-activities'),
    path('reports/members/', get_report_members, name='report-members'),
    path('reports/activities-by-month/', get_activities_by_month, name='activities-by-month'),
    path('reports/participation-by-month/', get_participation_by_month, name='participation-by-month'),
    path('reports/activity-types/', get_activity_types, name='activity-types'),
    path('reports/download/', download_report, name='download-report'),
] 