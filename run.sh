 #!/bin/bash
set -e
LOGFILE=logs/gunicorn.log
LOGDIR=$(dirname $LOGFILE)
NUM_WORKERS=3

# user/group to run as
USER=cwiz
GROUP=1000

source /usr/local/bin/virtualenvwrapper.sh
workon food

test -d $LOGDIR || mkdir -p $LOGDIR

exec python manage.py run_gunicorn -w $NUM_WORKERS --user=$USER --group=$GROUP --log-level=debug --log-file=$LOGFILE 2>>$LOGFILE