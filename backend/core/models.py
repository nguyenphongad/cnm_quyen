from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Người dùng phải có địa chỉ email')
        if not username:
            raise ValueError('Người dùng phải có tên đăng nhập')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('CAN_BO_DOAN', 'Cán bộ đoàn'),
        ('ADMIN', 'Admin'),
        ('DOAN_VIEN', 'Đoàn viên'),
    )
    
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DOAN_VIEN')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    student_id = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    member_since = models.DateTimeField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'full_name']
    
    def __str__(self):
        return self.username
    
    class Meta:
        db_table = 'core_user'

class Post(models.Model):
    STATUS_CHOICES = (
        ('Draft', 'Nháp'),
        ('Published', 'Đã đăng'),
        ('Deleted', 'Đã xóa'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    
    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

class Activity(models.Model):
    STATUS_CHOICES = (
        ('Upcoming', 'Sắp diễn ra'),
        ('Ongoing', 'Đang diễn ra'),
        ('Completed', 'Đã hoàn thành'),
    )
    
    TYPE_CHOICES = (
        ('Học tập', 'Học tập'),
        ('Tình nguyện', 'Tình nguyện'),
        ('Văn hóa', 'Văn hóa'),
        ('Thể thao', 'Thể thao'),
        ('Khác', 'Khác'),
    )
    
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Upcoming')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    location = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Khác')
    max_participants = models.IntegerField(null=True, blank=True)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    image = models.ImageField(upload_to='activities/', null=True, blank=True)
    
    def __str__(self):
        return self.title
    
    @property
    def participants_count(self):
        """Return the number of active registrations for this activity"""
        return self.registrations.filter(status__in=['Approved', 'Attended']).count()
    
    @property
    def current_participants(self):
        """Return the current number of participants"""
        return self.participants_count
    
    class Meta:
        db_table = 'activities'
        ordering = ['-start_date']

class WorkSchedule(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Chờ xử lý'),
        ('Completed', 'Đã hoàn thành'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='work_schedules')
    title = models.CharField(max_length=255)
    description = models.TextField()
    schedule_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'work_schedules'
        ordering = ['-schedule_date']

class ActivityRegistration(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Chờ duyệt'),
        ('Approved', 'Đã duyệt'),
        ('Rejected', 'Từ chối'),
        ('Attended', 'Đã tham gia'),
        ('Cancelled', 'Đã hủy'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_registrations')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='registrations')
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    attendance_date = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Thêm các trường thông tin bổ sung
    reason = models.TextField(blank=True, null=True, help_text="Lý do tham gia hoạt động")
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    dietary_requirements = models.TextField(blank=True, null=True)
    additional_info = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.activity.title}"
    
    class Meta:
        db_table = 'activity_registrations'
        unique_together = ['user', 'activity']

class Notification(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Notification for {self.user.username}"
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

class Permission(models.Model):
    PERMISSION_CHOICES = (
        ('Read', 'Đọc'),
        ('Write', 'Viết'),
        ('Delete', 'Xóa'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='permissions', null=True, blank=True)
    permission_type = models.CharField(max_length=20, choices=PERMISSION_CHOICES)
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='granted_permissions')
    
    def __str__(self):
        return f"{self.user.username} - {self.permission_type}"
    
    class Meta:
        db_table = 'permissions'

class MemberAchievement(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    class Meta:
        db_table = 'member_achievements'
        ordering = ['-date']

class UnionFeeStatus(models.Model):
    QUARTER_CHOICES = (
        (1, 'Quý 1'),
        (2, 'Quý 2'),
        (3, 'Quý 3'),
        (4, 'Quý 4'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='union_fees')
    year = models.IntegerField()
    quarter = models.IntegerField(choices=QUARTER_CHOICES)
    paid = models.BooleanField(default=False)
    date_paid = models.DateTimeField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=15000.00)
    
    def __str__(self):
        return f"{self.user.username} - {self.year} - Q{self.quarter}"
    
    class Meta:
        db_table = 'union_fee_status'
        unique_together = ['user', 'year', 'quarter']
        ordering = ['-year', 'quarter']

class MemberActivity(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='member_activities')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='member_activities')
    date = models.DateTimeField()
    type = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
    points = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username} - {self.activity.title}"
    
    class Meta:
        db_table = 'member_activities'
        ordering = ['-date']

class MemberStatistics(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='member_stats')
    total_activities = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    attendance_rate = models.IntegerField(default=0)
    rank = models.CharField(max_length=50, default='Chưa xếp hạng')
    
    def __str__(self):
        return f"{self.user.username} - Statistics"
    
    class Meta:
        db_table = 'member_statistics' 