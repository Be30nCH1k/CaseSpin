from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Item(models.Model):
    RARITY_CHOICES = [
        ('blue', 'Mil-Spec'),
        ('purple', 'Restricted'),
        ('pink', 'Classified'),
        ('red', 'Covert'),
        ('gold', 'Exceedingly Rare'),
    ]

    weapon_name = models.CharField(
        max_length=255,
        verbose_name="Название оружия"
    )

    skin_name = models.CharField(
        max_length=255,
        verbose_name="Название скина"
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    rarity = models.CharField(
        max_length=10,
        choices=RARITY_CHOICES,
        default='blue'
    )

    image_url = models.URLField(
        blank=True,max_length=2000
    )

    def __str__(self):
        return f"{self.weapon_name} | {self.skin_name} ({self.rarity})"

class Case(models.Model):
    CATEGORY_CHOICES = [
        ('cheap', 'Дешевые'),
        ('middle', 'Средние'),
        ('expensive', 'Дорогие'),
    ]

    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES, 
        default='cheap'
    )
    image_url = models.URLField(blank=True, max_length=2000)
    items = models.ManyToManyField(Item, through='CaseItem')

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

class CaseItem(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)

    chance = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        help_text="Шанс выпадения в %"
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
            f"{self.item.weapon_name} | "
            f"{self.item.skin_name} "
            f"in {self.case.name} "
            f"({self.chance}%)"
        )

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

class InventoryItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    dropped_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} won {self.item.weapon_name} | {self.item.skin_name}"