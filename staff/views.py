from django.contrib.auth.decorators import login_required
from django.db.transaction import commit_on_success
from django.shortcuts import redirect
from django.views.generic.simple import direct_to_template

from models import Office


@login_required
@commit_on_success
def config(request):
    if request.method == 'POST':
        office = Office.objects.get(id=request.POST['office'])
        p = request.user.get_profile()
        p.office = office
        p.save()
        return redirect('dinner.views.reserve')

    return direct_to_template(request, 'staff/config.html', dict(
        offices = Office.objects.all()
    ))
