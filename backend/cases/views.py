from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .serializers import RegisterSerializer
from django.db import transaction
import random

from .models import (
    Case,
    InventoryItem,
    Profile
)

from .serializers import (
    CaseSerializer,
    InventoryItemSerializer
)
from django.db.models import F


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated]
    )
    @transaction.atomic
    def spin(self, request, pk=None):
        user = request.user

        case = self.get_object()

        with transaction.atomic():
            profile = Profile.objects.select_for_update().get(
                user=user
            )

            if profile.balance < case.price:
                return Response(
                    {"error": "Недостаточно средств"},
                    status=400
                )

            max_range = case.caseitem_set.order_by('-range_to').first().range_to
            roll = random.randint(1, max_range)

            won_case_item = case.caseitem_set.filter(
                range_from__lte=roll,
                range_to__gte=roll
            ).first()

            if not won_case_item:
                return Response(
                    {"error": "Предмет для выпадения не найден"},
                    status=400
                )

            won_item = won_case_item.item

            profile.balance = F('balance') - case.price
            profile.save()
            profile.refresh_from_db()

            InventoryItem.objects.create(
                user=user,
                item=won_item
            )

        return Response({
            "won_item": {
                "weapon_name": won_item.weapon_name,
                "skin_name": won_item.skin_name,
                "rarity": won_item.rarity,
                "price": won_item.price,
                "image_url": won_item.image_url
            },
            "new_balance": profile.balance
        })

class RecentDropsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryItem.objects.all().order_by(
        "-dropped_at"
    )[:20]
    serializer_class = InventoryItemSerializer


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InventoryItem.objects.filter(
            user=self.request.user
        ).order_by("-dropped_at")

    @action(detail=True, methods=["post"])
    def sell(self, request, pk=None):
        with transaction.atomic():
            inventory_item = self.get_queryset().filter(
                id=pk
            ).first()

            if not inventory_item:
                return Response(
                    {"error": "Предмет не найден"},
                    status=404
                )

            profile = Profile.objects.select_for_update().get(
                user=request.user
            )

            sell_price = inventory_item.item.price
            sold_item_name = (
                f"{inventory_item.item.weapon_name} | "
                f"{inventory_item.item.skin_name}"
            )

            profile.balance += sell_price
            profile.save()

            inventory_item.delete()

        return Response({
            "success": True,
            "sold_item": sold_item_name,
            "sell_price": sell_price,
            "new_balance": profile.balance
        })


class UserInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inventory = InventoryItem.objects.filter(
            user=request.user
        ).order_by("-dropped_at")

        serializer = InventoryItemSerializer(
            inventory,
            many=True
        )

        return Response(serializer.data)


