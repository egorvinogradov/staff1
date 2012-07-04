# coding: utf-8

import pyExcelerator as xls

from datetime import datetime
from itertools import count

def get_group(title):
    title = title.replace(u'NEW ', '').lower().strip()
    return title

def parse_day(s):
    return datetime.strptime(s.split(' ')[0], '%d.%m.%y').date()

def process(file):

    first_sheet = False
    f = open(file, 'r')

    for sheet_name, values in xls.parse_xls(f, 'cp1251'):
        if not first_sheet:
            first_sheet = True

        day = parse_day(sheet_name)
        group = None

        for row_idx in count(2):
            if not (row_idx, 0) in values:
                break

            elif group is None or not ( (row_idx, 1) in values ):
                group = get_group(values[(row_idx, 0)])

            else:
                dish = {
                    'index': values[(row_idx, 0)],
                    'name': values[(row_idx, 1)],
                    'weight': values[(row_idx, 2)] if (row_idx, 2) in values else None,
                    'price': float(values[(row_idx, 3)])
                }

                yield day, group, dish
