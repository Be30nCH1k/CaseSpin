from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import random


def get_random_avatar(username: str) -> str:
    # генерирую случайный аватар для нового пользователя
    styles = [
        'adventurer', 'avataaars', 'big-ears', 'croodles',
        'fun-emoji', 'lorelei', 'micah', 'miniavs',
        'notionists', 'open-peeps', 'personas', 'pixel-art'
    ]

    style = random.choice(styles)

    return f"https://api.dicebear.com/7.x/{style}/svg?seed={username}"


class Item(models.Model):
    RARITY_CHOICES = [
        ('blue', 'Mil-Spec'),
        ('purple', 'Restricted'),
        ('pink', 'Classified'),
        ('red', 'Covert'),
        ('gold', 'Exceedingly Rare'),
    ]

    weapon_name = models.CharField(max_length=255)
    skin_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=100, decimal_places=2)
    rarity = models.CharField(
        max_length=10,
        choices=RARITY_CHOICES,
        default='blue'
    )
    image_url = models.URLField(
        blank=True,
        max_length=2000
    )

    def __str__(self):
        return (
            f"{self.weapon_name} | "
            f"{self.skin_name} ({self.rarity})"
        )


class Case(models.Model):
    CATEGORY_CHOICES = [
        ('cheap', 'Дешевые'),
        ('middle', 'Средние'),
        ('expensive', 'Дорогие'),
    ]

    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=100, decimal_places=2)
    description = models.TextField(blank=True)

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='cheap'
    )

    image_url = models.URLField(
        blank=True,
        max_length=2000
    )

    items = models.ManyToManyField(
        Item,
        through='CaseItem'
    )

    def __str__(self):
        return (
            f"{self.name} "
            f"({self.get_category_display()})"
        )


class CaseItem(models.Model):
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE
    )

    chance = models.DecimalField(
        max_digits=8,
        decimal_places=4
    )

    range_from = models.IntegerField(
        null=True,
        blank=True
    )

    range_to = models.IntegerField(
        null=True,
        blank=True
    )

    def __str__(self):
        return (
            f"{self.item} "
            f"in {self.case} "
            f"({self.chance}%)"
        )


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    balance = models.DecimalField(
        max_digits=100,
        decimal_places=2,
        default=0.00
    )

    avatar_url = models.URLField(
        blank=True,
        max_length=2000
    )

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def save(self, *args, **kwargs):
        # если аватар не указан генерирую автоматически
        if not self.avatar_url:
            self.avatar_url = get_random_avatar(
                self.user.username
            )

        super().save(*args, **kwargs)


@receiver(post_save, sender=User)
def create_user_profile(
    sender,
    instance,
    created,
    **kwargs
):
    # создаю профиль сразу после регистрации
    if created:
        Profile.objects.create(user=instance)


class InventoryItem(models.Model):
    # храню предметы которые сейчас лежат в инвентаре
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='inventory'
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE
    )

    dropped_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.user.username} | "
            f"{self.item}"
        )


class DropHistory(models.Model):
    # храню всю историю дропов даже после продажи
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='drop_history'
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE
    )

    inventory_item = models.OneToOneField(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history'
    )

    dropped_at = models.DateTimeField(
        auto_now_add=True
    )

    is_sold = models.BooleanField(
        default=False
    )

    def __str__(self):
        status = (
            "продан"
            if self.is_sold
            else "в инвентаре"
        )

        return (
            f"{self.user.username} | "
            f"{self.item} [{status}]"
        )


class ContractHistory(models.Model):
    # сохраняю результаты контрактов для истории
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='contract_history'
    )

    result_item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='contract_results'
    )

    input_value = models.DecimalField(
        max_digits=100,
        decimal_places=2
    )

    result_value = models.DecimalField(
        max_digits=100,
        decimal_places=2
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.user.username} | "
            f"{self.result_item} | "
            f"{self.created_at:%Y-%m-%d %H:%M}"
        )