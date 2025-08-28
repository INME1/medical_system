from django.contrib import admin
from .models import Doctor

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'medical_id', 'role', 'status']
    list_filter = ['department', 'role', 'status']
    search_fields = ['name', 'medical_id']