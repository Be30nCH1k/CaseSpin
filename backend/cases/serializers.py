from rest_framework import serializers
from .models import Item, Case, CaseItem, InventoryItem, DropHistory
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Item
        fields = '__all__'


class CaseItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer()

    class Meta:
        model  = CaseItem
        fields = ['item', 'chance']


class CaseSerializer(serializers.ModelSerializer):
    items = CaseItemSerializer(source='caseitem_set', many=True, read_only=True)

    class Meta:
        model  = Case
        fields = ['id', 'name', 'price', 'description', 'items', 'image_url', 'category']


class InventoryItemSerializer(serializers.ModelSerializer):
    item     = ItemSerializer()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = InventoryItem
        fields = ['id', 'username', 'item', 'dropped_at']


class DropHistorySerializer(serializers.ModelSerializer):
    item         = ItemSerializer()
    username     = serializers.CharField(source='user.username', read_only=True)
    inventory_item_id = serializers.IntegerField(
        source='inventory_item.id',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model  = DropHistory
        fields = ['id', 'username', 'item', 'dropped_at', 'is_sold', 'inventory_item_id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    access   = serializers.CharField(read_only=True)
    refresh  = serializers.CharField(read_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'access', 'refresh']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        refresh      = RefreshToken.for_user(user)
        user.access  = str(refresh.access_token)
        user.refresh = str(refresh)
        return user

    def to_representation(self, instance):
        data            = super().to_representation(instance)
        data['access']  = instance.access
        data['refresh'] = instance.refresh
        return data


class UpgradeSkinSerializer(serializers.ModelSerializer):
    weapon_name = serializers.CharField(source='item.weapon_name')
    skin_name = serializers.CharField(source='item.skin_name')
    price = serializers.FloatField(source='item.price')
    rarity = serializers.CharField(source='item.rarity')
    image_url = serializers.CharField(source='item.image_url')

    class Meta:
        model = InventoryItem
        fields = ['id', 'weapon_name', 'skin_name', 'price', 'rarity', 'image_url']


class TargetItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    weapon_name = serializers.CharField()
    skin_name = serializers.CharField()
    price = serializers.FloatField()
    rarity = serializers.CharField()
    image_url = serializers.CharField()
    chance_percentage = serializers.FloatField(required=False, help_text="Динамический шанс относительно выбранного предмета")


class UpgradePerformSerializer(serializers.Serializer):
    item_id = serializers.IntegerField(help_text="ID предмета из инвентаря для апгрейда")
    balance_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Сумма баланса для добавления"
    )
    target_item_id = serializers.IntegerField(help_text="ID целевого предмета")
    multiplier = serializers.ChoiceField(
        choices=['x2', 'x4', 'x8'],
        default='x2',
        help_text="Множитель (не используется, оставлен для совместимости)"
    )


class UpgradeResultSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    won_item = serializers.DictField(required=False)
    new_balance = serializers.CharField()
    message = serializers.CharField(required=False)
    chance_used = serializers.FloatField(required=False)