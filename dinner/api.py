import datetime
from tastypie import http
from tastypie.authorization import DjangoAuthorization, Authorization

from tastypie.resources import ModelResource
from tastypie.utils.dict import dict_strip_unicode_keys
from dinner.models import Day, WEEK_DAYS, Week, OrderDayItem, Order, DishDay
from dinner.utils import get_week_start_day


class DayResource(ModelResource):


    class Meta:
        queryset = Day.objects.filter(week__date__gt=(datetime.datetime.now() - datetime.timedelta(days=7)))
        resource_name = 'day'


    def dehydrate(self, bundle):
        bundle.data = {
            'weekday': WEEK_DAYS[bundle.obj.day - 1],
            'date': bundle.obj.week.date + datetime.timedelta(days=bundle.obj.day),
            'providers': self.__get_grouped_dishes(bundle.obj),
            }

        return bundle


    def __get_grouped_dishes(self, day):
        dish_days = DishDay.objects.filter(day=day)
        providers = {}

        for dish_day in dish_days:
            dish = dish_day.dish
            provider_name = dish.provider.name
            providers[provider_name] = providers.get(provider_name, {})

            group_name = dish.group.title
            providers[provider_name][group_name] = providers[provider_name].get(group_name, [])

            providers[provider_name][group_name].append(
                    {
                    'id': dish.id,
                    'name': dish.title,
                    'price': dish_day.price,
                    'weight': dish.weight,
                    }
            )

        return providers


class OrderDayItemResource(ModelResource):

    class Meta:
        queryset = OrderDayItem.objects.filter(
            order__week__date__gt=(datetime.datetime.now() - datetime.timedelta(days=7)))
        resource_name = 'order'
        authorization = Authorization()

    def post_list(self, request, **kwargs):
        """
        Creates a new resource/object with the provided data.

        Calls ``obj_create`` with the provided data and returns a response
        with the new resource's location.

        If a new resource is created, return ``HttpCreated`` (201 Created).
        If ``Meta.always_return_data = True``, there will be a populated body
        of serialized data.
        """
        deserialized = self.deserialize(request, request.raw_post_data, format=request.META.get('CONTENT_TYPE', 'application/json'))
        deserialized = self.alter_deserialized_detail_data(request, deserialized)
        bundle = self.build_bundle(data=dict_strip_unicode_keys(deserialized), request=request)
        self.is_valid(bundle, request)


        bundle.obj = self._meta.object_class()

        for key, value in kwargs.items():
            setattr(bundle.obj, key, value)

        updated_bundle = self.full_hydrate(bundle)

        location = self.get_resource_uri(updated_bundle)

        return self.create_response(request, updated_bundle, response_class=http.HttpCreated, location=location)

    def full_hydrate(self, bundle):
        current_week = Week.objects.get(date=get_week_start_day(datetime.datetime.today()))

        if current_week.closed:
            raise ValueError('Week is already closed')

        order, _ = Order.objects.get_or_create(
            user_id=bundle.request.user.id,
            week_id=current_week.id
        )
        updated = False

        for date, data in bundle.data.items():
            dishes = data.get('dishes', {})

            if dishes:
                for dish_id, count in dishes.items():
                    item, created = OrderDayItem.objects.get_or_create(
                        order=order,
                        dish_id=dish_id,
                    )

                    updated = not created or updated
                    item.count = count
                    item.save()

                continue

            restaurant = bundle.data[date].get('restaurant')
            if restaurant:
                continue

            raise NotImplementedError('please supply restaurant or dishes')

        if updated:
            order.donor = None
            order.save()

        bundle.data = {
            'status': 'ok'
        }

        return bundle