from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')

dashboard_router = DefaultRouter()
dashboard_router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(dashboard_router.urls)),
] 