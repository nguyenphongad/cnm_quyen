from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import (
    User, Post, Activity, WorkSchedule, 
    ActivityRegistration, Notification, Permission
)

class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'full_name', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Thông tin cá nhân', {'fields': ('full_name', 'phone_number', 'address')}),
        ('Quyền hạn', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'full_name', 'password1', 'password2', 'role'),
        }),
    )
    search_fields = ('username', 'email', 'full_name')
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)

class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'

class ActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'start_date', 'end_date')
    list_filter = ('status', 'start_date')
    search_fields = ('title', 'description')
    date_hierarchy = 'start_date'

class WorkScheduleAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'schedule_date')
    list_filter = ('status', 'schedule_date')
    search_fields = ('title', 'description')
    date_hierarchy = 'schedule_date'

class ActivityRegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity', 'status', 'registration_date')
    list_filter = ('status', 'registration_date')
    search_fields = ('user__username', 'activity__title')
    date_hierarchy = 'registration_date'

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('user__username', 'content')
    date_hierarchy = 'created_at'

class PermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'permission_type', 'granted_by')
    list_filter = ('permission_type',)
    search_fields = ('user__username', 'post__title')

admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Activity, ActivityAdmin)
admin.site.register(WorkSchedule, WorkScheduleAdmin)
admin.site.register(ActivityRegistration, ActivityRegistrationAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(Permission, PermissionAdmin)
admin.site.unregister(Group) 