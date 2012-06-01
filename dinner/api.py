import datetime
from tastypie import http
from tastypie.authorization import DjangoAuthorization, Authorization

from tastypie.resources import ModelResource, Resource
from tastypie.utils.dict import dict_strip_unicode_keys
from dinner.models import Day, WEEK_DAYS, Week, OrderDayItem, Order, DishDay, FavoriteDish, Dish
from dinner.utils import get_week_start_day


class DayResource(ModelResource):
    class Meta:
        queryset = Day.objects.filter(week__date__gte=(datetime.datetime.now() - datetime.timedelta(days=7)))
        resource_name = 'day'


    def dehydrate(self, bundle):
        bundle.data = {
            'weekday': WEEK_DAYS[bundle.obj.day - 1],
            'date': bundle.obj.date,
            'providers': self.__get_grouped_dishes(bundle.obj),
            }

        return bundle


    def __get_grouped_dishes(self, day):
        dish_days = DishDay.objects.filter(day=day).select_related(
            'dish', 'day', 'dish__provider', 'dish__group', 'day__week')
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
        queryset = Order.objects.all()
        resource_name = 'order'
        authorization = Authorization()

    def get_object_list(self, request):
        return self._meta.queryset._clone().filter(user=request.user)

    def dehydrate(self, bundle):
        order = bundle.obj
        data = {}
        for order_day in OrderDayItem.objects.filter(order=order):
            # todo: test fails here, wtf @cwiz
            try:
                dish_day = order_day.dish_day
            except DishDay.DoesNotExist:
                continue

            count = order_day.count
            price = dish_day.price
            dish = dish_day.dish
            day = dish_day.day

            date = day.date
            data_date = data[str(date)] = data.get(str(date), {})
            data_date['weekday'] = WEEK_DAYS[date.weekday()]
            data_date['restaurant'] = False
            data_date['none'] = False
            data_providers = data_date['providers'] = data_date.get('providers', {})
            data_provider = data_providers[dish.provider.name] = data_providers.get(dish.provider.name, {})
            data_cat = data_provider[dish.group.title] = data_provider.get(dish.group.title, [])
            data_cat.append({
                'name': dish.title,
                'price': price,
                'count': count,
                'id': dish.id,
                })

        bundle.data = data

        return bundle


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
                        dish_day_id=dish_id,
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


class FavoriteDishResource(ModelResource):
    class Meta:
        queryset = Dish.objects.all()
        resource_name = 'favorite'
        authorization = Authorization()


    def dehydrate(self, bundle):
        bundle.data['favorite'] = FavoriteDish.objects.filter(dish=bundle.obj).exists()
        bundle.data['provider'] = bundle.obj.provider.name
        bundle.data['group'] = bundle.obj.group.title

        return bundle


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


    def hydrate(self, bundle):
        favorite_ids = bundle.data['objects']

        FavoriteDish.objects.filter(user=bundle.request.user).exclude(dish__id__in=favorite_ids).delete()

        for id in favorite_ids:
            FavoriteDish.objects.get_or_create(user=bundle.request.user, dish_id=id)

        bundle.data = {
            'status': 'ok'
        }

        return bundle

