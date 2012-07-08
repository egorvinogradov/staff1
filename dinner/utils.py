from django.db.utils import IntegrityError
from dinner.models import Dish, Group, Provider, DishDay, Week, Day
from datetime import timedelta

from tastypie import http
from tastypie.authorization import DjangoAuthorization, Authorization
from tastypie.resources import ModelResource, Resource
from tastypie.utils.dict import dict_strip_unicode_keys

def group_by_materialize(seq):
    return [(k, list(v)) for k, v in seq]

def get_week_start_day_menu(day):
    weekday = day.weekday()
    delta = -weekday if weekday < 3 else (7-weekday)

    day += timedelta(days=delta)
    return day

def get_week_start_day(day):

    #weekday = day.weekday()
    #delta = -weekday if weekday < 3 else (7-weekday)

    day += timedelta(days=-day.weekday())
    return day


def import_menu(process_function, provider_name, path):
    group_cache = {}
    day_cache = {}
    week_cache = {}

    db_provider, db_provider_created = Provider.objects.get_or_create(name=provider_name)

    for day, group, dish in process_function(path):
        db_group = group_cache.get(group)
        if not db_group:
            db_group, db_group_created = Group.objects.get_or_create(
                name=group
            )
            group_cache[group] = db_group

        db_dish, db_dish_created = Dish.objects.get_or_create(
            group=db_group,
            name=dish['name'],
            provider=db_provider,
            index=0,
        )

        dish_weight = dish['weight']
        if db_dish.weight != dish_weight:
            db_dish.weight = dish_weight
            db_dish.save()

        week_start_day = get_week_start_day(day)
        db_week = week_cache.get(week_start_day)
        if not db_week:
            db_week, db_week_created = Week.objects.get_or_create(
                date=week_start_day,
            )
            week_cache[week_start_day] = db_week

        db_day = day_cache.get(((day - week_start_day).days, db_week))
        if not db_day:
            db_day, db_day_created = Day.objects.get_or_create(
                day=(day - week_start_day).days,
                week=db_week
            )
            day_cache[((day - week_start_day).days, db_week)] = db_day

        DishDay.objects.get_or_create(
            dish=db_dish,
            day=db_day,
            price=dish['price']
        )

    # since this function is used in admin to populate Menu model which uses week we return weeks imported
    return week_cache.values()



class NotSoTastyPieModelResource(ModelResource):
    def add_shit_to_meta(self, request, data):
        pass

    def get_list(self, request, **kwargs):
        """
        Returns a serialized list of resources.

        Calls ``obj_get_list`` to provide the data, then handles that result
        set and serializes it.

        Should return a HttpResponse (200 OK).
        """
        # TODO: Uncached for now. Invalidation that works for everyone may be
        #       impossible.
        objects = self.obj_get_list(request=request, **self.remove_api_resource_names(kwargs))
        sorted_objects = self.apply_sorting(objects, options=request.GET)

        paginator = self._meta.paginator_class(request.GET, sorted_objects, resource_uri=self.get_resource_uri(),
            limit=self._meta.limit, max_limit=self._meta.max_limit, collection_name=self._meta.collection_name)
        to_be_serialized = paginator.page()

        # Dehydrate the bundles in preparation for serialization.
        bundles = [self.build_bundle(obj=obj, request=request) for obj in to_be_serialized['objects']]
        to_be_serialized['objects'] = [self.full_dehydrate(bundle) for bundle in bundles]
        to_be_serialized = self.alter_list_data_to_serialize(request, to_be_serialized)

        self.add_shit_to_meta(request, to_be_serialized)

        return self.create_response(request, to_be_serialized)

    def post_list(self, request, **kwargs):
        deserialized = self.deserialize(request, request.raw_post_data,
            format=request.META.get('CONTENT_TYPE', 'application/json'))

        print deserialized

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
