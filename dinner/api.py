# coding: utf-8
import datetime

from tastypie.authentication import Authentication
from tastypie.cache import SimpleCache
from tastypie.resources import ModelResource

from dinner.models import (
    Day, 
    Dish, 
    DishDay, 
    DishOrderDayItem, 
    EmptyOrderDayItem,
    FavoriteDish, 
    Order, 
    RestaurantOrderDayItem, 
    Week, 
    WEEK_DAYS, 
)
from dinner.utils import (
    get_week_start_day, 
    get_week_start_day_menu,
    NotSoTastyDjangoAuthorization,
    NotSoTastyPieModelResource, 
)

from django.utils.datastructures import SortedDict


class DayResource(ModelResource):
    
    def __get_grouped_dishes(self, day):
        dish_days = DishDay.objects.filter(day=day)\
            .select_related('dish', 'day', 'dish__provider', 'dish__group', 'day__week')
        providers = {}

        for dish_day in dish_days:
            dish = dish_day.dish
            provider_name = dish.provider.name
            providers[provider_name] = providers.get(provider_name, {})

            group_name = dish.group.name
            providers[provider_name][group_name] = providers[provider_name].get(group_name, [])

            providers[provider_name][group_name].append(
                    {
                    'id': dish.id,
                    'name': dish.name,
                    'price': dish_day.price,
                    'weight': dish.weight,
                    'favorite': FavoriteDish.objects.filter(dish=dish).exists()
                }
            )

        return providers

    def dehydrate(self, bundle):
        bundle.data = {
            'weekday': WEEK_DAYS[bundle.obj.day],
            'date': bundle.obj.date,
            'providers': self.__get_grouped_dishes(bundle.obj),
            }

        return bundle

    class Meta:
        queryset = Day.objects.filter(week__date__gte=get_week_start_day_menu(datetime.date.today())).order_by('week__date')
        resource_name = 'day'
        authentication = Authentication()
        authorization = NotSoTastyDjangoAuthorization()
        limit = 500


class OrderDayItemResource(NotSoTastyPieModelResource):
    def __fill_date_dict(self, data, date):
        data_date = data[str(date)] = data.get(str(date), SortedDict())
        data_date['weekday']    = WEEK_DAYS[date.weekday()]
        data_date['restaurant'] = data_date.get('restaurant', False)
        data_date['none']       = data_date.get('none', False)
        data_date['dishes']     = data_date.get('dishes', {})

        return data_date

    def __fill_dish_order_day_items(self, data, order):
        dish_order_day_items = DishOrderDayItem.objects.filter(order=order).select_related(
            'dish_day', 'dish_day__dish', 'dish_day__day')

        for dish_order_day_item in dish_order_day_items:
            dish_day = dish_order_day_item.dish_day
            count = dish_order_day_item.count

            price = dish_day.price
            dish = dish_day.dish
            day = dish_day.day

            date = day.date
            data_date = self.__fill_date_dict(data, date)

            dishes = data_date['dishes'] = data_date.get('dishes', {})
            groups = dishes[dish.provider.name] = dishes.get(dish.provider.name, {})
            group = groups[dish.group.name] = groups.get(dish.group.name, [])

            group.append({
                'name': dish.name,
                'price': price,
                'count': count,
                'id': dish.id,
                })

    def __fill_restaurant_order_day_items(self, data, order):
        restaurant_order_day_items = RestaurantOrderDayItem.objects.filter(order=order).select_related('day')
        for restaurant_order_day_item in restaurant_order_day_items:
            date = restaurant_order_day_item.day.date
            data_date = self.__fill_date_dict(data, date)
            data_date['restaurant'] = restaurant_order_day_item.restaurant_name

    def __fill_empty_order_day_items(self, data, order):
        empty_order_day_items = EmptyOrderDayItem.objects.filter(order=order).select_related('day')
        for empty_order_day_item in empty_order_day_items:
            date = empty_order_day_item.day.date
            data_date = self.__fill_date_dict(data, date)
            data_date['none'] = True


    def get_object_list(self, request):
        return super(OrderDayItemResource, self).get_object_list(request).filter(user=request.user).order_by('-week__date')[:1]


    def add_shit_to_meta(self, request, data):
        current_week = Week.objects.order_by('-date')[:1]
        current_week = current_week[0] if current_week else None

        if not current_week:
            data['meta']['current_week_open'] = False
            data['meta']['made_order'] = False
            return

        #if not current_week.closed and current_week.date < datetime.date.today():
        #    current_week.closed = True

        data['meta']['current_week_open'] = not current_week.closed 
        data['meta']['made_order'] = Order.objects.filter(user=request.user, week=current_week).exists()


    def dehydrate(self, bundle):
        order = bundle.obj
        data = SortedDict()

        self.__fill_dish_order_day_items(data, order)
        self.__fill_restaurant_order_day_items(data, order)
        self.__fill_empty_order_day_items(data, order)

        bundle.data = data

        return bundle

    def hydrate(self, bundle):
        if not len(bundle.data):
            raise ValueError('Supply data at least for 1 day')

        first_order_day = datetime.datetime.strptime(sorted(bundle.data.keys())[0], '%Y-%m-%d')
        week_start_date = get_week_start_day(first_order_day)
        current_week = Week.objects.get(date=week_start_date)

        if current_week.closed:
            raise ValueError('Week is already closed')

        order, _ = Order.objects.get_or_create(
            user=bundle.request.user,
            week_id=current_week.id
        )

        for date, data in bundle.data.items():

            dt = datetime.datetime.strptime(date, '%Y-%m-%d')
            week = Week.objects.get(date=week_start_date)
            day = Day.objects.get(week=week, day=dt.weekday())

            empty = data.get('empty', False)
            if empty:
                DishOrderDayItem.objects.filter(day=day, order=order).delete()
                RestaurantOrderDayItem.objects.filter(day=day, order=order).delete()
                EmptyOrderDayItem.objects.filter(day=day, order=order).delete()
                continue

            dishes = data.get('dishes', {})
            if dishes:
                for dish, count in dishes.items():
                    try:
                        dish_day = DishDay.objects.get(dish=dish, day=day)
                    except DishDay.DoesNotExist:
                        continue

                    order_day_item, created = DishOrderDayItem.objects.get_or_create(
                        order=order,
                        dish_day=dish_day,
                        day=day,
                    )

                    order_day_item.count = count
                    order_day_item.save()

                continue

            restaurant = bundle.data[date].get('restaurant')
            if restaurant:
                RestaurantOrderDayItem.objects.get_or_create(
                    order=order,
                    day=day,
                    restaurant_name=restaurant
                )
                continue

            none = bundle.data[date].get('none')
            if none:
                EmptyOrderDayItem.objects.get_or_create(
                    order=order,
                    day=day
                )

                continue

            raise NotImplementedError('please supply restaurant or dishes')

        bundle.data = {
            'status': 'ok'
        }

        return bundle


    class Meta:
        queryset = Order.objects.all()
        resource_name = 'order'
        authentication = Authentication()
        authorization = NotSoTastyDjangoAuthorization()
        limit = 500


class FavoriteDishResource(NotSoTastyPieModelResource):
    def dehydrate(self, bundle):
        bundle.data['favorite'] = FavoriteDish.objects.filter(dish=bundle.obj, user=bundle.request.user).exists()
        bundle.data['provider'] = bundle.obj.provider.name
        bundle.data['group'] = bundle.obj.group.name

        return bundle

    def hydrate(self, bundle):
        favorite_ids = bundle.data['objects']

        FavoriteDish.objects.filter(user=bundle.request.user).exclude(dish__id__in=favorite_ids).delete()

        for id in favorite_ids:
            FavoriteDish.objects.get_or_create(user=bundle.request.user, dish_id=id)

        bundle.data = {
            'status': 'ok'
        }

        return bundle

    class Meta:
        queryset = Dish.objects.all().select_related('provider', 'group')
        resource_name = 'favorite'
        authentication = Authentication()
        authorization = NotSoTastyDjangoAuthorization()
        limit = 500
