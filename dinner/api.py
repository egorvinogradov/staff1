import datetime

from annoying.decorators import JsonResponse
from tastypie.resources import ModelResource
from dinner.models import Day, WEEK_DAYS, Dish, Week, OrderDayItem, Order, DishDay

class ReserveDishesResource(ModelResource):

    class Meta:
        queryset = Day.objects.filter(week__date__gt=(datetime.datetime.now() - datetime.timedelta(days=7)))
        resource_name = 'day'

    def dehydrate(self, bundle):
        bundle.data = {
            'weekday': WEEK_DAYS[bundle.obj.day],
            'date': bundle.obj.week.date + datetime.timedelta(days=bundle.obj.day),
            'providers': self.__get_grouped_dishes(bundle.obj),
            }

        return bundle


    def hydrate(self, bundle):
        current_week = Week.objects.filter(date__lte=datetime.datetime.today()).order_by('-date')[0]
        if current_week.closed:
            response = JsonResponse({
                'message': 'Week is already closed',
                })
            response.status = 400
            return response

        order = Order.objects.get_or_create(user=bundle.request.user, week=current_week)

        updated = False
        for date, dishes in bundle.data:
            for dish in dishes:
                try:
                    item = OrderDayItem.objects.get(order=order, dish__id=dish['id'])

                    if item.count != dish['count']:
                        updated = True
                        item.count = dish['count']
                        item.save()

                except OrderDayItem.DoesNotExist:
                    OrderDayItem(
                        order=order,
                        dish_id=dish['id'],
                        count=int(dish['count'])
                    ).save()

        if updated:
            order.donor = None
            order.save()

        return JsonResponse({'status': 'ok',})


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
