#!/bin/bash

cd ..

source /usr/local/bin/virtualenvwrapper.sh
workon food
pip install -r requirements.txt

set -e
LOGFILE=logs/gunicorn.log
LOGDIR=$(dirname $LOGFILE)
NUM_WORKERS=3

# user/group to run as
USER=cwiz

test -d $LOGDIR || mkdir -p $LOGDIR

cp upstart.conf /etc/init/food.conf
ln -s /lib/init/upstart-job /etc/init.d/food

exec python manage.py run_gunicorn -w $NUM_WORKERS --user=$USER --log-level=debug --log-file=$LOGFILE 2>>$LOGFILE