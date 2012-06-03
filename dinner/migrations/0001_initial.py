# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Provider'
        db.create_table('dinner_provider', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=20)),
        ))
        db.send_create_signal('dinner', ['Provider'])

        # Adding model 'Week'
        db.create_table('dinner_week', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('date', self.gf('django.db.models.fields.DateField')(unique=True)),
            ('closed', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('dinner', ['Week'])

        # Adding model 'Menu'
        db.create_table('dinner_menu', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('week', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Week'])),
            ('provider', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Provider'])),
            ('source', self.gf('django.db.models.fields.files.FileField')(max_length=100)),
        ))
        db.send_create_signal('dinner', ['Menu'])

        # Adding unique constraint on 'Menu', fields ['week', 'provider']
        db.create_unique('dinner_menu', ['week_id', 'provider_id'])

        # Adding model 'Day'
        db.create_table('dinner_day', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('week', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Week'])),
            ('day', self.gf('django.db.models.fields.PositiveIntegerField')()),
        ))
        db.send_create_signal('dinner', ['Day'])

        # Adding unique constraint on 'Day', fields ['week', 'day']
        db.create_unique('dinner_day', ['week_id', 'day'])

        # Adding model 'Group'
        db.create_table('dinner_group', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal('dinner', ['Group'])

        # Adding model 'Dish'
        db.create_table('dinner_dish', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('provider', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Provider'])),
            ('group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Group'])),
            ('index', self.gf('django.db.models.fields.PositiveIntegerField')()),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('weight', self.gf('django.db.models.fields.CharField')(max_length=60, null=True)),
        ))
        db.send_create_signal('dinner', ['Dish'])

        # Adding model 'DishDay'
        db.create_table('dinner_dishday', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('dish', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Dish'])),
            ('day', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Day'])),
            ('price', self.gf('django.db.models.fields.DecimalField')(max_digits=20, decimal_places=2)),
        ))
        db.send_create_signal('dinner', ['DishDay'])

        # Adding unique constraint on 'DishDay', fields ['day', 'dish']
        db.create_unique('dinner_dishday', ['day_id', 'dish_id'])

        # Adding model 'FavoriteDish'
        db.create_table('dinner_favoritedish', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('dish', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Dish'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
        ))
        db.send_create_signal('dinner', ['FavoriteDish'])

        # Adding unique constraint on 'FavoriteDish', fields ['dish', 'user']
        db.create_unique('dinner_favoritedish', ['dish_id', 'user_id'])

        # Adding model 'Order'
        db.create_table('dinner_order', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('week', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Week'])),
            ('donor', self.gf('django.db.models.fields.related.ForeignKey')(related_name='order_donor_set', null=True, to=orm['auth.User'])),
        ))
        db.send_create_signal('dinner', ['Order'])

        # Adding unique constraint on 'Order', fields ['user', 'week']
        db.create_unique('dinner_order', ['user_id', 'week_id'])

        # Adding model 'OrderDayItem'
        db.create_table('dinner_orderdayitem', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('order', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Order'])),
            ('dish_day', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.DishDay'])),
            ('count', self.gf('django.db.models.fields.PositiveSmallIntegerField')(default=1)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('dinner', ['OrderDayItem'])

        # Adding unique constraint on 'OrderDayItem', fields ['order', 'dish_day']
        db.create_unique('dinner_orderdayitem', ['order_id', 'dish_day_id'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'OrderDayItem', fields ['order', 'dish_day']
        db.delete_unique('dinner_orderdayitem', ['order_id', 'dish_day_id'])

        # Removing unique constraint on 'Order', fields ['user', 'week']
        db.delete_unique('dinner_order', ['user_id', 'week_id'])

        # Removing unique constraint on 'FavoriteDish', fields ['dish', 'user']
        db.delete_unique('dinner_favoritedish', ['dish_id', 'user_id'])

        # Removing unique constraint on 'DishDay', fields ['day', 'dish']
        db.delete_unique('dinner_dishday', ['day_id', 'dish_id'])

        # Removing unique constraint on 'Day', fields ['week', 'day']
        db.delete_unique('dinner_day', ['week_id', 'day'])

        # Removing unique constraint on 'Menu', fields ['week', 'provider']
        db.delete_unique('dinner_menu', ['week_id', 'provider_id'])

        # Deleting model 'Provider'
        db.delete_table('dinner_provider')

        # Deleting model 'Week'
        db.delete_table('dinner_week')

        # Deleting model 'Menu'
        db.delete_table('dinner_menu')

        # Deleting model 'Day'
        db.delete_table('dinner_day')

        # Deleting model 'Group'
        db.delete_table('dinner_group')

        # Deleting model 'Dish'
        db.delete_table('dinner_dish')

        # Deleting model 'DishDay'
        db.delete_table('dinner_dishday')

        # Deleting model 'FavoriteDish'
        db.delete_table('dinner_favoritedish')

        # Deleting model 'Order'
        db.delete_table('dinner_order')

        # Deleting model 'OrderDayItem'
        db.delete_table('dinner_orderdayitem')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2012, 6, 3, 3, 23, 5, 699698)'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2012, 6, 3, 3, 23, 5, 699586)'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'dinner.day': {
            'Meta': {'unique_together': "[('week', 'day')]", 'object_name': 'Day'},
            'day': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'week': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Week']"})
        },
        'dinner.dish': {
            'Meta': {'object_name': 'Dish'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'index': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'provider': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Provider']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'weight': ('django.db.models.fields.CharField', [], {'max_length': '60', 'null': 'True'})
        },
        'dinner.dishday': {
            'Meta': {'unique_together': "(('day', 'dish'),)", 'object_name': 'DishDay'},
            'day': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Day']"}),
            'dish': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Dish']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'price': ('django.db.models.fields.DecimalField', [], {'max_digits': '20', 'decimal_places': '2'})
        },
        'dinner.favoritedish': {
            'Meta': {'unique_together': "(('dish', 'user'),)", 'object_name': 'FavoriteDish'},
            'dish': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Dish']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'dinner.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'dinner.menu': {
            'Meta': {'unique_together': "(('week', 'provider'),)", 'object_name': 'Menu'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'provider': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Provider']"}),
            'source': ('django.db.models.fields.files.FileField', [], {'max_length': '100'}),
            'week': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Week']"})
        },
        'dinner.order': {
            'Meta': {'unique_together': "(('user', 'week'),)", 'object_name': 'Order'},
            'donor': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'order_donor_set'", 'null': 'True', 'to': "orm['auth.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'week': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Week']"})
        },
        'dinner.orderdayitem': {
            'Meta': {'unique_together': "(('order', 'dish_day'),)", 'object_name': 'OrderDayItem'},
            'count': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '1'}),
            'dish_day': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.DishDay']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'order': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Order']"}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'dinner.provider': {
            'Meta': {'object_name': 'Provider'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'})
        },
        'dinner.week': {
            'Meta': {'object_name': 'Week'},
            'closed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'date': ('django.db.models.fields.DateField', [], {'unique': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['dinner']
