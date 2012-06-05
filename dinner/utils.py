from dinner.models import Dish, Group, Provider, DishDay, Week, Day
from datetime import timedelta

from tastypie import http
from tastypie.authorization import DjangoAuthorization, Authorization
from tastypie.resources import ModelResource, Resource
from tastypie.utils.dict import dict_strip_unicode_keys

def group_by_materialize(seq):
    return [(k, list(v)) for k, v in seq]


def get_week_start_day(day):
    day -= timedelta(days=day.weekday())
    return day


def import_menu(process_function, provider_name, path):

    cnt_day_dishes = 0
    cnt_dishes = 0

    for day, group, dish in process_function(path):

        db_group, db_group_created = Group.objects.get_or_create(name=group)
        db_provider, db_provider_created = Provider.objects.get_or_create(name=provider_name)
        db_dish, db_dish_created = Dish.objects.get_or_create(
            group=db_group,
            name=dish['name'],
            provider=db_provider,
            index=0,
        )

        db_dish.weight = dish['weight']
        db_dish.save()

        week_start_day = get_week_start_day(day)
        db_week, db_week_created = Week.objects.get_or_create(
            date = week_start_day,
        )

        week_day = (day - week_start_day).days
        db_day, db_day_created = Day.objects.get_or_create(day=week_day, week=db_week)

        db_dish_day, db_dish_day_created = DishDay.objects.get_or_create(
            dish=db_dish,
            day=db_day,
            price=dish['price']
        )

        cnt_dishes += int(db_dish_created)
        cnt_day_dishes += int(db_dish_day_created)

    return cnt_dishes, cnt_day_dishes

class NotSoTastyPieModelResource(ModelResource):

    def post_list(self, request, **kwargs):
        deserialized = self.deserialize(request, request.raw_post_data,
            format=request.META.get('CONTENT_TYPE', 'application/json'))

        deserialized = self.alter_deserialized_detail_data(request, deserialized)
        bundle = self.build_bundle(data=dict_strip_unicode_keys(deserialized), request=request)

        self.is_valid(bundle, request)

        bundle.obj = self._meta.object_class()

        for key, value in kwargs.items():
            setattr(bundle.obj, key, value)

        updated_bundle = self.full_hydrate(bundle)

        location = self.get_resource_uri(updated_bundle)

        return self.create_response(request, updated_bundle, response_class=http.HttpCreated, location=location)


class NotSoTastyDjangoAuthorization(Authorization):
    def is_authorized(self, request, object=None):
        return request.user.is_authenticated()
