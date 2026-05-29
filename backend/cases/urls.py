from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CaseViewSet,
    RecentDropsViewSet,
    InventoryViewSet,
    DropHistoryViewSet,
    RegisterView,
    MeView,
    MyTokenObtainPairView,
    UpgradeViewSet
)

router = DefaultRouter()
router.register(r'cases',        CaseViewSet,        basename='cases')
router.register(r'recent-drops', RecentDropsViewSet, basename='recent-drops')
router.register(r'inventory',    InventoryViewSet,   basename='inventory')
router.register(r'drop-history', DropHistoryViewSet, basename='drop-history')
router.register(r'upgrade', UpgradeViewSet, basename='upgrade')


urlpatterns = [
    path('', include(router.urls)),
    path('register/',      RegisterView.as_view(),          name='register'),
    path('login/',         MyTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(),      name='token_refresh'),
    path('me/',            MeView.as_view(),                name='me'),
]