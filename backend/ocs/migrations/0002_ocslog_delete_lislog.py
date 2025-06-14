# Generated by Django 4.2 on 2025-06-11 02:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ocs', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OCSLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('LIS', 'LIS'), ('PACS', 'PACS'), ('LOGIN', 'Login'), ('EMR', 'EMR'), ('WORKLIST', 'Worklist')], max_length=20)),
                ('patient_uuid', models.CharField(blank=True, max_length=36, null=True)),
                ('doctor_uuid', models.CharField(blank=True, max_length=36, null=True)),
                ('detail', models.JSONField(blank=True, null=True)),
                ('step', models.CharField(choices=[('order', '오더 생성'), ('sample', '샘플 등록'), ('result', '결과 등록')], max_length=10)),
                ('patient_id', models.CharField(max_length=100)),
                ('doctor_id', models.CharField(blank=True, max_length=100, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.DeleteModel(
            name='LISLog',
        ),
    ]
