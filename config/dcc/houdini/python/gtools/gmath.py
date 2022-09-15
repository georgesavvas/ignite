from __future__ import absolute_import, division, unicode_literals, print_function


def clamp(value, newmin, newmax):
    return max(newmin, min(value, newmax))


def fit01(value, newmin, newmax):
    newvalue = value * (newmax - newmin) + newmin
    newvalue = clamp(newvalue, newmin, newmax)
    return newvalue


def fit(value, oldmin, oldmax, newmin, newmax):
    norm = (value - oldmin) / (oldmax - oldmin)
    newvalue = fit01(norm, newmin, newmax)
    newvalue = clamp(newvalue, newmin, newmax)
    return newvalue
