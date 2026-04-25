from rest_framework import serializers
from .models import Item, Case, CaseItem, InventoryItem
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class CaseItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer()

    class Meta:
        model = CaseItem
        fields = ['item', 'chance']

class CaseSerializer(serializers.ModelSerializer):
    items = CaseItemSerializer(source='caseitem_set', many=True, read_only=True)

    class Meta:
        model = Case
        fields = ['id', 'name', 'price', 'description', 'items','image_url','category']

class InventoryItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = InventoryItem
        fields = ['id', 'username', 'item', 'dropped_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'access',
            'refresh'
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        refresh = RefreshToken.for_user(user)

        user.access = str(refresh.access_token)
        user.refresh = str(refresh)

        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['access'] = instance.access
        data['refresh'] = instance.refresh

        return data