OPENID_REDIRECT_NEXT = '/accounts/openid/done/'
#OPENID_REDIRECT_NEXT = '/'

OPENID_SREG = {
    "requred": "nickname, email, fullname",
    "optional":"postcode, country",
    "policy_url": ""
}

#example should be something more like the real thing, i think
OPENID_AX = (
    {
        "type_uri": "http://axschema.org/contact/email",
        "count": 1,
        "required": True,
        "alias": "email"
    },
    {
        "type_uri": "http://axschema.org/schema/fullname",
        "count": 1,
        "required": False,
        "alias": "fname"
    },
)

OPENID_AX_PROVIDER_MAP = {
    'Google': {'email': 'http://axschema.org/contact/email',
        'firstname': 'http://axschema.org/namePerson/first',
        'lastname': 'http://axschema.org/namePerson/last'
    },
    #'Default': {
    #    'email': 'http://axschema.org/contact/email',
    #    'fullname': 'http://axschema.org/namePerson',
    #    'nickname': 'http://axschema.org/namePerson/friendly'
    #},
}

SOCIAL_AUTH_CREATE_USERS = True
SOCIAL_AUTH_ASSOCIATE_BY_MAIL = True