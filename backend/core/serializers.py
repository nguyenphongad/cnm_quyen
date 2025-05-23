from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Post, Activity, WorkSchedule, 
    ActivityRegistration, Notification, Permission,
    MemberAchievement, UnionFeeStatus, MemberActivity, MemberStatistics
)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 
                  'phone_number', 'address', 'date_joined', 'is_active', 'last_login',
                  'student_id', 'department', 'position', 'member_since', 'avatar']
        read_only_fields = ['id', 'date_joined', 'last_login']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 
                  'phone_number', 'address', 'password']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'address', 'is_active']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'title', 'content', 'created_at', 
                  'updated_at', 'status']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author']
    
    def get_author(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.full_name
        }
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ActivitySerializer(serializers.ModelSerializer):
    user_details = UserSerializer(read_only=True, source='user')
    participants_count = serializers.IntegerField(read_only=True)
    current_participants = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Activity
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 
                 'status', 'user', 'user_details', 'location', 'participants_count', 
                 'current_participants', 'type', 'max_participants', 'registration_deadline', 'image']
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['participants_count'] = instance.participants_count
        representation['current_participants'] = instance.current_participants
        if not representation['image']:
            representation['image'] = None
        return representation
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class WorkScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkSchedule
        fields = ['id', 'title', 'description', 'schedule_date', 'status']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ActivityRegistrationSerializer(serializers.ModelSerializer):
    activity_detail = ActivitySerializer(source='activity', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = ActivityRegistration
        fields = ['id', 'user', 'user_detail', 'activity', 'activity_detail', 
                  'registration_date', 'status', 'attendance_date', 'notes',
                  'reason', 'phone_number', 'emergency_contact', 
                  'dietary_requirements', 'additional_info']
        read_only_fields = ['id', 'registration_date', 'activity_detail', 'user_detail', 'attendance_date']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'created_at']

class PermissionSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    granted_by_detail = UserSerializer(source='granted_by', read_only=True)
    
    class Meta:
        model = Permission
        fields = ['id', 'user', 'user_detail', 'post', 'permission_type', 
                  'granted_by', 'granted_by_detail']
        read_only_fields = ['id', 'user_detail', 'granted_by_detail']

# Serializers mới cho sổ đoàn viên
class MemberAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberAchievement
        fields = ['id', 'title', 'description', 'date']
        read_only_fields = ['id']

class UnionFeeQuarterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnionFeeStatus
        fields = ['quarter', 'paid', 'date_paid']

class UnionFeeYearSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    quarters = UnionFeeQuarterSerializer(many=True)

class MemberActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberActivity
        fields = ['id', 'title', 'date', 'type', 'status', 'points']
    
    title = serializers.SerializerMethodField()
    
    def get_title(self, obj):
        return obj.activity.title

class MemberStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberStatistics
        fields = ['total_activities', 'total_points', 'attendance_rate', 'rank']

# Serializer tổng hợp cho API sổ đoàn viên
class MemberBookSerializer(serializers.ModelSerializer):
    achievements = MemberAchievementSerializer(many=True, read_only=True)
    activities = serializers.SerializerMethodField()
    union_fee_status = serializers.SerializerMethodField()
    stats = MemberStatisticsSerializer(source='member_stats', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'username', 'student_id', 'department', 
                  'position', 'date_joined', 'member_since', 'avatar',
                  'activities', 'achievements', 'union_fee_status', 'stats']
    
    def get_activities(self, obj):
        member_activities = MemberActivity.objects.filter(user=obj)
        return MemberActivitySerializer(member_activities, many=True).data
    
    def get_union_fee_status(self, obj):
        result = []
        # Lấy tất cả năm có dữ liệu đoàn phí
        years = UnionFeeStatus.objects.filter(user=obj).values_list('year', flat=True).distinct()
        
        for year in years:
            quarters = UnionFeeStatus.objects.filter(user=obj, year=year)
            serializer = UnionFeeQuarterSerializer(quarters, many=True)
            result.append({
                'year': year,
                'quarters': serializer.data
            })
        
        return result 