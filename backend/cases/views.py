from rest_framework import viewsets, serializers as drf_serializers, status
from rest_framework.decorators import action
from django.db.models.functions import Abs
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import RegisterSerializer, UpgradeSkinSerializer, UpgradePerformSerializer
from django.db import transaction
from django.db.models import Sum, F
import random
from decimal import Decimal
from django.db import models as django_models

from .models import Case, InventoryItem, Profile, DropHistory, Item, ContractHistory
from .serializers import CaseSerializer, InventoryItemSerializer, DropHistorySerializer, ContractPerformSerializer,DepositSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # пихаю в jwt-токен баланс и аватарку чтобы фронт не дёргал /me лишний раз
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            profile = user.profile
            token['balance']    = str(profile.balance)
            token['avatar_url'] = profile.avatar_url
            token['username']   = user.username
        except Profile.DoesNotExist:
            token['balance']    = '0.00'
            token['avatar_url'] = ''
            token['username']   = user.username
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            # на случай, если профиль не создался
            profile = Profile.objects.create(user=user)

        # ищу лучший дроп за всё время просто сортирую по цене
        best = (
            DropHistory.objects
            .filter(user=user)
            .select_related('item')
            .order_by('-item__price')
            .first()
        )

        best_drop = None
        if best:
            best_drop = {
                'weapon_name': best.item.weapon_name,
                'skin_name':   best.item.skin_name,
                'price':       str(best.item.price),
                'image_url':   best.item.image_url,
                'rarity':      best.item.rarity,
            }

        return Response({
            'username':   user.username,
            'balance':    str(profile.balance),
            'avatar_url': profile.avatar_url,
            'best_drop':  best_drop,
        })


class CaseViewSet(viewsets.ReadOnlyModelViewSet):
    # кейсы только на чтение крутить можно через /spin
    queryset         = Case.objects.all()
    serializer_class = CaseSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def spin(self, request, pk=None):
        user = request.user
        case = self.get_object()

        with transaction.atomic():
            # блокирую профиль чтобы баланс не ушёл в минус при параллельных запросах
            profile = Profile.objects.select_for_update().get(user=user)

            if profile.balance < case.price:
                return Response({"error": "Недостаточно средств"}, status=400)

            # определяю границы рандома по самому большому range_to в кейсе
            max_range     = case.caseitem_set.order_by('-range_to').first().range_to
            roll          = random.randint(1, max_range)
            won_case_item = case.caseitem_set.filter(
                range_from__lte=roll, range_to__gte=roll
            ).first()

            if not won_case_item:
                return Response({"error": "Предмет не найден"}, status=400)

            won_item = won_case_item.item

            # списываю через F() потом обновляю объект из базы
            profile.balance = F('balance') - case.price
            profile.save()
            profile.refresh_from_db()

            inventory_item = InventoryItem.objects.create(user=user, item=won_item)

            # история хранится даже после продажи предмета
            DropHistory.objects.create(
                user=user,
                item=won_item,
                inventory_item=inventory_item,
            )

        return Response({
            "won_item": {
                "weapon_name": won_item.weapon_name,
                "skin_name":   won_item.skin_name,
                "rarity":      won_item.rarity,
                "price":       str(won_item.price),
                "image_url":   won_item.image_url,
            },
            "inventory_id": inventory_item.id,
            "new_balance":  str(profile.balance),
        })


class RecentDropsViewSet(viewsets.ReadOnlyModelViewSet):
    # лента последних дропов видно всем, просто последние 20 записей инвентаря
    queryset         = InventoryItem.objects.all().order_by("-dropped_at")[:20]
    serializer_class = InventoryItemSerializer


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # показываю только шмотки текущего юзера
        return InventoryItem.objects.filter(user=self.request.user).order_by("-dropped_at")

    @action(detail=True, methods=["post"])
    def sell(self, request, pk=None):
        with transaction.atomic():
            inventory_item = self.get_queryset().filter(id=pk).first()
            if not inventory_item:
                return Response({"error": "Предмет не найден"}, status=404)

            profile    = Profile.objects.select_for_update().get(user=request.user)
            sell_price = inventory_item.item.price

            profile.balance += sell_price
            profile.save()

            # помечаю историю проданной сам инвентарь удаляю
            DropHistory.objects.filter(inventory_item=inventory_item).update(is_sold=True)
            inventory_item.delete()

        return Response({
            "success":     True,
            "sell_price":  str(sell_price),
            "new_balance": str(profile.balance),
        })

    @action(detail=False, methods=["post"], url_path="sell_many")
    def sell_many(self, request):
        # массовая продажа по списку id
        ids = request.data.get("ids", [])
        if not ids or not isinstance(ids, list):
            return Response({"error": "Передайте список ids"}, status=400)

        with transaction.atomic():
            items = InventoryItem.objects.select_related('item').filter(
                id__in=ids, user=request.user
            )
            if not items.exists():
                return Response({"error": "Предметы не найдены"}, status=404)

            total_price = items.aggregate(total=Sum('item__price'))['total'] or 0
            profile     = Profile.objects.select_for_update().get(user=request.user)
            profile.balance += total_price
            profile.save()

            DropHistory.objects.filter(inventory_item__in=items).update(is_sold=True)

            sold_count = items.count()
            items.delete()

        return Response({
            "success":     True,
            "sold_count":  sold_count,
            "total_price": str(total_price),
            "new_balance": str(profile.balance),
        })


class DropHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    # история дропов конкретного юзера только чтение
    serializer_class   = DropHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DropHistory.objects.filter(
            user=self.request.user
        ).select_related('item').order_by('-dropped_at')


class UserInventoryView(APIView):
    # запасной вариант получения инвентаря если вьюсет неудобен
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inventory  = InventoryItem.objects.filter(user=request.user).order_by("-dropped_at")
        serializer = InventoryItemSerializer(inventory, many=True)
        return Response(serializer.data)


class UpgradeViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='inventory')
    def get_inventory(self, request):
        # возвращаю инвентарь для страницы апгрейда
        items = InventoryItem.objects.filter(
            user=request.user
        ).select_related('item').order_by('-dropped_at')

        serializer = UpgradeSkinSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='target-items')
    def get_target_items(self, request):
        # считаю шанс апгрейда на лету цена_текущего / цена_целевого * 100
        selected_item_id = request.query_params.get('selected_item_id')

        items = Item.objects.all().order_by('-price')

        data = []
        selected_item_price = None

        if selected_item_id:
            try:
                selected_inventory_item = InventoryItem.objects.get(
                    id=selected_item_id,
                    user=request.user
                )
                selected_item_price = selected_inventory_item.item.price
            except InventoryItem.DoesNotExist:
                pass

        for item in items:
            item_data = {
                'id': item.id,
                'weapon_name': item.weapon_name,
                'skin_name': item.skin_name,
                'price': float(item.price),
                'rarity': item.rarity,
                'image_url': item.image_url,
            }

            if selected_item_price and selected_item_price < item.price:
                chance = (float(selected_item_price) / float(item.price)) * 100
                chance = min(99.99, max(0.01, round(chance, 2)))
                item_data['chance_percentage'] = chance
            elif selected_item_price and selected_item_price >= item.price:
                item_data['chance_percentage'] = 0  # нельзя апгрейдить в более дешёвое
            else:
                item_data['chance_percentage'] = None

            data.append(item_data)

        return Response(data)

    @action(detail=False, methods=['post'], url_path='perform')
    @transaction.atomic
    def perform_upgrade(self, request):
        # выполняю апгрейд сравниваю roll с динамическим шансом
        serializer = UpgradePerformSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_id = serializer.validated_data['item_id']
        balance_amount = serializer.validated_data['balance_amount']
        target_item_id = serializer.validated_data['target_item_id']

        try:
            inventory_item = InventoryItem.objects.select_related('item').get(
                id=item_id,
                user=request.user
            )
        except InventoryItem.DoesNotExist:
            return Response(
                {'error': 'Предмет не найден в инвентаре'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_item = Item.objects.get(id=target_item_id)
        except Item.DoesNotExist:
            return Response(
                {'error': 'Целевой предмет не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if target_item.price <= inventory_item.item.price:
            return Response(
                {'error': 'Целевой предмет должен быть дороже текущего'},
                status=status.HTTP_400_BAD_REQUEST
            )

        chance = (float(inventory_item.item.price) / float(target_item.price)) * 100
        chance = min(95, max(5, round(chance, 2)))

        roll = random.uniform(0.01, 99.99)
        roll = round(roll, 2)
        is_success = roll <= chance

        with transaction.atomic():
            profile = Profile.objects.select_for_update().get(user=request.user)

            if balance_amount > 0:
                if profile.balance < balance_amount:
                    return Response(
                        {'error': 'Недостаточно баланса'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                profile.balance -= balance_amount

            if is_success:
                new_item = InventoryItem.objects.create(
                    user=request.user,
                    item=target_item
                )

                DropHistory.objects.create(
                    user=request.user,
                    item=target_item,
                    inventory_item=new_item
                )

                DropHistory.objects.filter(
                    inventory_item=inventory_item
                ).update(is_sold=True)
                inventory_item.delete()

                profile.save()

                result_data = {
                    'success': True,
                    'won_item': {
                        'id': new_item.id,
                        'weapon_name': target_item.weapon_name,
                        'skin_name': target_item.skin_name,
                        'price': float(target_item.price),
                        'rarity': target_item.rarity,
                        'image_url': target_item.image_url,
                    },
                    'new_balance': str(profile.balance),
                    'chance_used': chance,
                    'roll': roll,
                    'message': f'Успех! Шанс был {chance}%, выпало {roll}%'
                }
            else:
                DropHistory.objects.filter(
                    inventory_item=inventory_item
                ).update(is_sold=True)
                inventory_item.delete()

                profile.save()

                result_data = {
                    'success': False,
                    'new_balance': str(profile.balance),
                    'chance_used': chance,
                    'roll': roll,
                    'lost_items': {
                        'weapon_name': inventory_item.item.weapon_name,
                        'skin_name': inventory_item.item.skin_name,
                        'price': float(inventory_item.item.price),
                    },
                    'lost_balance': str(balance_amount),
                    'message': f'Неудача! Шанс был {chance}%, выпало {roll}%'
                }

        return Response(result_data)


class ContractViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='perform')
    @transaction.atomic
    def perform_contract(self, request):
        # сдаю пачку скинов получаю один случайный в диапазоне 30% от рассчитанной награды
        serializer = ContractPerformSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_ids     = serializer.validated_data['item_ids']
        reward_price = serializer.validated_data['reward_price']

        inventory_items = InventoryItem.objects.select_related('item').filter(
            id__in=item_ids,
            user=request.user
        )

        if inventory_items.count() != len(item_ids):
            return Response(
                {'error': 'Один или несколько предметов не найдены в инвентаре'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_input = sum(i.item.price for i in inventory_items)

        # границы награды минимум 20% от суммы максимум 500%
        min_reward = total_input * Decimal('0.20')
        max_reward = total_input * Decimal('5.00')

        # если фронт прислал некорректную цену генерирую сам с логарифмическим весом
        if not (min_reward <= reward_price <= max_reward):
            t            = Decimal(str(random.random() ** 1.8))
            reward_price = min_reward + t * (max_reward - min_reward)
            reward_price = (reward_price / 10).quantize(Decimal('1')) * 10

        price_low  = reward_price * Decimal('0.70')
        price_high = reward_price * Decimal('1.30')

        candidate_items = list(
            Item.objects.filter(price__gte=price_low, price__lte=price_high)
        )

        if not candidate_items:
            candidate_items = list(
                Item.objects.annotate(
                    diff=Abs(F('price') - reward_price)
                ).order_by('diff')[:5]
            )

        if not candidate_items:
            return Response(
                {'error': 'Нет доступных предметов для выдачи'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result_item = random.choice(candidate_items)

        DropHistory.objects.filter(inventory_item__in=inventory_items).update(is_sold=True)
        inventory_items.delete()

        new_inventory_item = InventoryItem.objects.create(
            user=request.user,
            item=result_item
        )

        DropHistory.objects.create(
            user=request.user,
            item=result_item,
            inventory_item=new_inventory_item
        )

        ContractHistory.objects.create(
            user         = request.user,
            result_item  = result_item,
            input_value  = total_input,
            result_value = result_item.price,
        )

        profile = Profile.objects.get(user=request.user)

        return Response({
            'success': True,
            'item': {
                'id':          new_inventory_item.id,
                'weapon_name': result_item.weapon_name,
                'skin_name':   result_item.skin_name,
                'price':       str(result_item.price),
                'rarity':      result_item.rarity,
                'image_url':   result_item.image_url,
            },
            'input_value':  str(total_input),
            'result_value': str(result_item.price),
            'new_balance':  str(profile.balance),
        })

class DepositView(APIView):
    permission_classes = [IsAuthenticated]

    # промокоды захардкодил как на фронте чтобы совпадали
    PROMO_CODES = {
        'BONUS10':  10,
        'CASESPIN': 15,
        'WELCOME':  20,
    }

    @transaction.atomic
    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        method = serializer.validated_data['method']
        promo_code = serializer.validated_data.get('promo_code', '').strip().upper()

        with transaction.atomic():
            # блокирую профиль чтобы баланс не изменился параллельно
            profile = Profile.objects.select_for_update().get(user=request.user)

            # считаю бонус если промокод валидный
            bonus_percent = self.PROMO_CODES.get(promo_code, 0)
            bonus_amount = (amount * bonus_percent / 100).quantize(Decimal('0.01'))
            total_amount = amount + bonus_amount

            # начисляю баланс через F() чтобы избежать race condition
            profile.balance = F('balance') + total_amount
            profile.save()
            profile.refresh_from_db()

        return Response({
            'success': True,
            'amount': str(amount),
            'bonus_percent': bonus_percent,
            'bonus_amount': str(bonus_amount),
            'total_amount': str(total_amount),
            'method': method,
            'new_balance': str(profile.balance),
        })