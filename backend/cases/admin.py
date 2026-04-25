from django.contrib import admin
from .models import Item, Case, CaseItem

admin.site.register(Item)
admin.site.register(Case)
admin.site.register(CaseItem)