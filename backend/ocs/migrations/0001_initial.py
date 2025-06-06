# Generated by Django 5.2 on 2025-06-04 12:32

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='OCSLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_id', models.CharField(max_length=100)),
                ('patient_name', models.CharField(blank=True, max_length=100, null=True)),
                ('doctor_id', models.CharField(max_length=100)),
                ('doctor_name', models.CharField(blank=True, max_length=100, null=True)),
                ('request_type', models.CharField(max_length=100)),
                ('request_detail', models.TextField()),
                ('request_time', models.DateTimeField(auto_now_add=True)),
                ('result_type', models.CharField(blank=True, max_length=100, null=True)),
                ('result_time', models.DateTimeField(blank=True, null=True)),
            ],
        ),
    ]
