# Generated by Django 5.2.1 on 2025-05-29 01:24

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TestOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_id', models.IntegerField()),
                ('doctor_id', models.IntegerField()),
                ('test_type', models.CharField(max_length=50)),
                ('order_date', models.DateTimeField()),
            ],
        ),
    ]
