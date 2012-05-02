import datetime
import models as m
from tastypie.resources import ModelResource
from dinner.models import Day, WEEK_DAYS, Dish

class ReserveDishesResource(ModelResource):

    class Meta:
        queryset = Day.objects.filter(week__date__gt=(datetime.datetime.now() - datetime.timedelta(days=10)))
        resource_name = 'day'

    def dehydrate(self, bundle):

        bundle.data = {
            'weekday': WEEK_DAYS[bundle.obj.day],
            'date': bundle.obj.week.date + datetime.timedelta(days=bundle.obj.day),
            'providers': self.get_grouped_dishes(bundle.obj),
        }

        return bundle

    def hydrate(self, bundle):
        week = m.Week.objects.get(pk=bundle.request.POST['week'])

        order = m.Order.objects.get(user=order_user, week=week)

        if week.closed:
            return redirect('dinner.views.order_view', order.pk)

        updated = False
        for key, value in request.POST.items():
            if key.startswith('dish#') and value:
                dish_id = int(key[5:])
                try:
                    item = m.OrderDayItem.objects.get(order=order, dish__id=dish_id)
                    if item.count != int(value):
                        updated = True
                        item.count = int(value)
                        item.save()

                except m.OrderDayItem.DoesNotExist:
                    if int(value):
                        m.OrderDayItem(order=order, dish_id=dish_id, count=int(value)).save()
        if updated:
            order.donor = None
            order.save()


    def get_grouped_dishes(self, day):

        dishes = Dish.objects.filter(day=day).order_by('index').select_related('provider', 'group')

        providers = {}

        for dish in dishes:
            provider_name = dish.provider.name
            providers[provider_name] = providers.get(provider_name, {})

            group_name = dish.group.title
            providers[provider_name][group_name] = providers[provider_name].get(group_name, [])

            providers[provider_name][group_name].append(
                {
                    'id': dish.id,
                    'name': dish.title,
                    'price': dish.price,
                    'weight': dish.weight,
                }
            )

        print providers

        return providers
