from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AnonBurstThrottle(AnonRateThrottle):
    scope = 'anon_burst'


class UserBurstThrottle(UserRateThrottle):
    scope = 'user_burst'
