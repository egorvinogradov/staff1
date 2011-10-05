# coding: utf-8
from django.views.generic.simple import direct_to_template
from django.db import connections, transaction
from django.contrib.auth.decorators import login_required

@login_required
def add_git_key(request):
    msg = ''
    if request.method == 'POST':
        key = request.POST['key']
        cursor = connections['reviewdb'].cursor()
        cursor.execute('select max(seq) from account_ssh_keys')
        seq = int(cursor.fetchone()[0]) + 1
        cursor.execute("insert into account_ssh_keys (ssh_public_key, valid, account_id, seq) values (%s, 'Y', 1000017, %s)", [key, seq])
        transaction.commit_unless_managed(using='reviewdb')
        msg = 'Added'

    return direct_to_template(request, 'review/add_git_key.html', {
        'msg': msg,
    })
