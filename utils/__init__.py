# coding: utf-8

def group_by_materialize(seq):
    return [(k, list(v)) for k, v in seq]
