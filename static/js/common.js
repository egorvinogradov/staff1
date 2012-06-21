var Router = Backbone.Router.extend({

    // TODO: use regexp

    routes: {
        '':                     'start',
        'menu':                 'menu',
        'menu/':                'menu',
        'menu/:day':            'menu',
        'menu/:day/':           'menu',
        'menu/:day/:provider':  'menu',
        'menu/:day/:provider/': 'menu',
//        'luch/:day':            'overlayLuch',
//        'luch/:day/':           'overlayLuch',
//        'none/:day':            'overlayNone',
//        'none/:day/':           'overlayNone',
        'order':                'order',
        'order/':               'order',
        'favourites':           'favourites',
        'favourites/':          'favourites',
        'changeorder':                  'changeOrder',
        'changeorder/':                 'changeOrder',
        'changeorder/:day':             'changeOrder',
        'changeorder/:day/':            'changeOrder',
        'changeorder/:day/:provider':   'changeOrder',
        'changeorder/:day/:provider/':  'changeOrder'
    },
    start: function(){

        console.log('router start');

        this.refreshModel({
            page: {
                menu: true
            }
        });
    },
    menu: function(){

        var options = {
            day: arguments[0],
            provider: arguments[1]
        };

        if ( arguments[0] === 'luch' ) {
            options = {
                day: arguments[0],
                overlayType: 'restaurant'
            };
        }

        if ( arguments[0] === 'none' ) {
            options = {
                day: arguments[0],
                overlayType: 'none'
            };
        }

        console.log('router menu', options);

        this.refreshModel({
            page: {
                menu: true
            },
            options: options
        });
    },
    changeOrder: function(){

        var options = {
            changeOrder: true,
            day: arguments[0],
            provider: arguments[1]
        };

        if ( arguments[0] === 'luch' ) {
            options = {
                changeOrder: true,
                day: arguments[0],
                overlayType: 'restaurant'
            };
        }

        if ( arguments[0] === 'none' ) {
            options = {
                changeOrder: true,
                day: arguments[0],
                overlayType: 'none'
            };
        }

        console.log('router change menu', options);

        this.refreshModel({
            page: {
                menu: true
            },
            options: options
        });

    },
//    overlayLuch: function(day){
//
//        console.log('router overlay luch:', day);
//
//        this.refreshModel({
//            page: {
//                menu: true
//            },
//            options: {
//                overlayType: 'restaurant',
//                day: day
//            }
//        });
//
//    },
//    overlayNone: function(day){
//
//        console.log('router overlay none:', day);
//
//        this.refreshModel({
//            page: {
//                menu: true
//            },
//            options: {
//                overlayType: 'none',
//                day: day
//            }
//        });
//
//    },
    order: function(){

        console.log('router order');

        this.refreshModel({
            page: {
                order: true
            }
        });
    },
    favourites: function(){

        console.log('router favourites');

        this.refreshModel({
            page: {
                favourites: true
            }
        });
    },
    refreshModel: function(data){

        //console.log('refresh model:', data.page, data.options, app.model, app.model.get('options'));

//        var model = app.model,
//            options = model.get('options'),
//            page = model.get('page'),
//            day = model.day,
//            provider = model.provider,
//            condition =
//                data.page && data.page === page ||
//                    data.options && data.options.day === day && data.options.provider === provider;
//
//        if ( !condition ) {
                                        //            app.model.trigger('toggle');
//            console.log('TOGGLE');
//        }

        console.log('REFRESH MODEL', data, data.page, data.options);

        app.model.set({
            page: data.page,
            options: data.options
        });

    }
});


$(function(){

    var n = document.body.childNodes, l = n.length, c = [], i = 0;
    for ( ; i < l ; i++ ) n[i].nodeType === 8 && c.push(n[i]);
    console && console.log && console.log(c[ c.length - 1 ].nodeValue);

//    console = { // temporary
//        log: function(){},
//        warn: function(){},
//        error: function(){}
//    };

    console.log('backbone init');

    window.app = new AppView({
        model: new AppModel()
    });
    
    window.router = new Router();

    Backbone.history.start();

    if ( $.browser.msie && $.browser.version < 9 ) {
        $(window).mediaQueries();
    }

});
