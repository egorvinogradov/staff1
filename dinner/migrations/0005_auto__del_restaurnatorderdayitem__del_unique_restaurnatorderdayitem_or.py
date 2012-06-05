# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Removing unique constraint on 'RestaurnatOrderDayItem', fields ['order', 'id']
        db.delete_unique('dinner_restaurnatorderdayitem', ['order_id', 'id'])

        # Deleting model 'RestaurnatOrderDayItem'
        db.delete_table('dinner_restaurnatorderdayitem')

        # Adding model 'RestaurantOrderDayItem'
        db.create_table('dinner_restaurantorderdayitem', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('order', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Order'])),
            ('restaurant_name', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('dinner', ['RestaurantOrderDayItem'])

        # Adding unique constraint on 'RestaurantOrderDayItem', fields ['order', 'id']
        db.create_unique('dinner_restaurantorderdayitem', ['order_id', 'id'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'RestaurantOrderDayItem', fields ['order', 'id']
        db.delete_unique('dinner_restaurantorderdayitem', ['order_id', 'id'])

        # Adding model 'RestaurnatOrderDayItem'
        db.create_table('dinner_restaurnatorderdayitem', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('restaurant_name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('order', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dinner.Order'])),
        ))
        db.send_create_signal('dinner', ['RestaurnatOrderDayItem'])

        # Adding unique constraint on 'RestaurnatOrderDayItem', fields ['order', 'id']
        db.create_unique('dinner_restaurnatorderdayitem', ['order_id', 'id'])

        # Deleting model 'RestaurantOrderDayItem'
        db.delete_table('dinner_restaurantorderdayitem')


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
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2012, 6, 3, 4, 45, 28, 159349)'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2012, 6, 3, 4, 45, 28, 159120)'}),
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
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'provider': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Provider']"}),
            'weight': ('django.db.models.fields.CharField', [], {'max_length': '60', 'null': 'True'})
        },
        'dinner.dishday': {
            'Meta': {'unique_together': "(('day', 'dish'),)", 'object_name': 'DishDay'},
            'day': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Day']"}),
            'dish': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Dish']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'price': ('django.db.models.fields.DecimalField', [], {'max_digits': '20', 'decimal_places': '2'})
        },
        'dinner.dishorderdayitem': {
            'Meta': {'unique_together': "(('order', 'dish_day'),)", 'object_name': 'DishOrderDayItem'},
            'count': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '1'}),
            'dish_day': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.DishDay']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'order': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Order']"})
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
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
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
        'dinner.provider': {
            'Meta': {'object_name': 'Provider'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'})
        },
        'dinner.restaurantorderdayitem': {
            'Meta': {'unique_together': "(('order', 'id'),)", 'object_name': 'RestaurantOrderDayItem'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'order': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['dinner.Order']"}),
            'restaurant_name': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        'dinner.week': {
            'Meta': {'object_name': 'Week'},
            'closed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'date': ('django.db.models.fields.DateField', [], {'unique': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['dinner']
