#!/bin/bash

sudo cp 	upstart.conf 			/etc/init/food.conf
sudo cp 	nginx.conf 				/etc/nginx/sites-available/food
sudo ln -s 	/lib/init/upstart-job 	/etc/init.d/food