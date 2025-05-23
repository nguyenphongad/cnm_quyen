from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, Post, Activity

class UserTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='Admin',
            full_name='Admin User'
        )
        self.canbodoan_user = User.objects.create_user(
            username='canbodoan',
            email='canbodoan@example.com',
            password='password123',
            role='CanBoDoan',
            full_name='Can Bo Doan User'
        )
        self.doanvien_user = User.objects.create_user(
            username='doanvien',
            email='doanvien@example.com',
            password='password123',
            role='DoanVien',
            full_name='Doan Vien User'
        )
    
    def test_user_creation(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(reverse('user-list'), {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'full_name': 'New User',
            'role': 'DoanVien'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 4)
    
    def test_user_retrieve(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('user-detail', args=[self.doanvien_user.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'doanvien')

class PostTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.canbodoan_user = User.objects.create_user(
            username='canbodoan',
            email='canbodoan@example.com',
            password='password123',
            role='CanBoDoan',
            full_name='Can Bo Doan User'
        )
        self.post = Post.objects.create(
            user=self.canbodoan_user,
            title='Test Post',
            content='This is a test post content',
            status='Published'
        )
    
    def test_post_creation(self):
        self.client.force_authenticate(user=self.canbodoan_user)
        response = self.client.post(reverse('post-list'), {
            'title': 'New Post',
            'content': 'This is a new post content',
            'status': 'Draft'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 2)
    
    def test_post_retrieve(self):
        self.client.force_authenticate(user=self.canbodoan_user)
        response = self.client.get(reverse('post-detail', args=[self.post.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Post')

class ActivityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.canbodoan_user = User.objects.create_user(
            username='canbodoan',
            email='canbodoan@example.com',
            password='password123',
            role='CanBoDoan',
            full_name='Can Bo Doan User'
        )
        self.activity = Activity.objects.create(
            user=self.canbodoan_user,
            title='Test Activity',
            description='This is a test activity description',
            start_date='2023-10-01T10:00:00Z',
            end_date='2023-10-02T16:00:00Z',
            status='Upcoming'
        )
    
    def test_activity_creation(self):
        self.client.force_authenticate(user=self.canbodoan_user)
        response = self.client.post(reverse('activity-list'), {
            'title': 'New Activity',
            'description': 'This is a new activity description',
            'start_date': '2023-11-01T10:00:00Z',
            'end_date': '2023-11-02T16:00:00Z',
            'status': 'Upcoming'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Activity.objects.count(), 2)
    
    def test_activity_retrieve(self):
        self.client.force_authenticate(user=self.canbodoan_user)
        response = self.client.get(reverse('activity-detail', args=[self.activity.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Activity') 