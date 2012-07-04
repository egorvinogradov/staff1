# coding: utf-8
# внутри __init__.py он почему-то кидался, но не ловился по WrongDomain
class WrongDomain(Exception):
    def __init__(self, email, domain):
        super(WrongDomain, self).__init__(u'Auth using non-{0} accounts is forbidden'.format(domain))
        self.email = email
        self.domain = domain
