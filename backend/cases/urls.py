from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    CaseViewSet,
    RecentDropsViewSet,
    InventoryViewSet,
    RegisterView,
)

router = DefaultRouter()

router.register(r'cases', CaseViewSet, basename='cases')
router.register(r'recent-drops', RecentDropsViewSet, basename='recent-drops')
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('', include(router.urls)),

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]