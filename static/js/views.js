var AppView = Backbone.View.extend({
    el: config.selectors.wrapper,
    els: {},
    template: _.template($('#template_page').html()),
    initialize: function(){

        $(this.el).html(this.template());

        this.els.page = $(config.selectors.page);
        this.els.header = $(config.selectors.header.container, this.el);
        this.els.content = $(config.selectors.content.container, this.el);
        this.els.wrapper = $(config.selectors.content.wrapper, this.el);

        this.model.bind('change', this.toggle, this);

        this.header = new HeaderView({
            el: this.els.header,
            page: this.page,
            options: this.options,
            app: this
        });
    },
    toggle: function(){

        var page = this.model.get('page'),
            options = this.model.get('options'),
            params;

        if ( !_.isEqual(this.page, page) ) {

            console.log('APP THIS RENDER', page, options);

            this.page = this.model.get('page');
            this.options = this.model.get('options');
            this.render();
        }

        else {

            if ( !_.isEqual(this.options, options) ) {

                console.log('APP THIS PART-RENDER', page, options);

                params = {
                    page: page,
                    options: options
                };

                if ( page.menu ) this.menu.render(params);
                if ( page.order ) this.order.render(params);
                if ( page.favourites ) this.favourites.render(params);

                this.page = this.model.get('page');
                this.options = this.model.get('options');
            }
        }
    },
    render: function(page){
//
//        var config = {
//
//            menu: {
//                model: MenuModel,
//                view: MenuView
//            },
//            order: {
//                model: OrderModel,
//                view: OrderView
//            },
//            favourites: {
//                model: FavouritesModel,
//                view: FavouritesView
//            }
//        };
//
//        this[page] = new config[page].view({
//            model: new config[page].model,
//            el: this.els.wrapper,
//            app: this
//        });
//
//

        if ( this.page.menu ) {
            this.menu = new MenuView({
                model: new MenuModel(),
                el: this.els.wrapper,
                app: this
            });
        }

        if ( this.page.order ) {
            this.order = new OrderView({
                model: new OrderModel(),
                el: this.els.wrapper,
                app: this
            });
        }

        if ( this.page.favourites ) {
            this.favourites = new FavouritesView({
                model: new FavouritesModel(),
                el: this.els.wrapper,
                app: this
            });
        }
    },
    resetPage: function(){

        _.each(config.classes.page, function(className){
            this.els.page.removeClass(className);
        }, this);

        _.each(config.classes.content, function(className){
            this.els.content.removeClass(className);
            this.els.wrapper.removeClass(className);
        }, this);

    },
    fetchModel: function(model, callback, context){

        model.fetch({
            success: $.proxy(callback, context || window),
            error: function(error){
                this.catchError('can\'t fetch model from ' + model.url, {
                    model: model,
                    callback: callback,
                    context: context,
                    error: error
                });
            }
        });
    },
    getLocalData: function(key){

        var value;

        if ( typeof localStorage === 'undefined' ) {
            this.catchError('localStorage isn\'t supported', { method: 'getLocalData' });
            return;
        }

        try {
            var data = JSON.parse(localStorage.getItem(key));
            value = data instanceof Object ? data : {};
        }
        catch (e) {
            this.catchError('invalid local data', {
                data: localStorage.getItem(key),
                error: e
            });
            value = {};
        }

        //console.log('GET LOCAL DATA', _.clone(value));

        return value;

    },
    setLocalData: function(key, value){

        if ( typeof localStorage == 'undefined' ) {
            this.catchError('localStorage isn\'t supported', { method: 'setLocalData' });
            return;
        }

        console.log('SET LOCAL DATA', value);

        localStorage.setItem(key, JSON.stringify(value));
        return value;
    },
    addToOrder: function(date, data){

        var order = this.getLocalData('order');

        if ( !order[date] ) {
            order[date] = {
                dishes: {},
                restaurant: false,
                none: false
            };
        }

        if ( data.dish && data.dish.id ) {

            order[date].dishes[data.dish.id] = data.dish.count || 1;
            order[date].restaurant = false;
            order[date].none = false;
        }
        else {

            if ( data.restaurant || data.restaurant === false ) {
                order[date].restaurant = data.restaurant;
                if ( data.restaurant ) {
                    order[date].none = false;
                }
            }

            if ( data.none || data.none === false ) {
                order[date].none = data.none;
                if ( data.none ) {
                    order[date].restaurant = false;
                }
            }
        }

        this.setLocalData('order', order);

    },
    removeDishFromOrder: function(date, id){

        var order = this.getLocalData('order');

        if ( order[date] && order[date].dishes && order[date].dishes[id] ) {
            delete order[date].dishes[id];
        }

        this.setLocalData('order', order);
    },
    makeOrder: function(menu){

        var order = this.getLocalData('order'),
            week = {},
            success = $.proxy(function(data){
                console.log('order OK', data);
            }, this),
            error = $.proxy(function(data){
                this.catchError('can\'t make order', order, data);
            }, this);

        _.each(order, function(data, date){

            if ( data.restaurant || data.none ) {
                data.dishes = {}
            }

            if ( !data.restaurant && _.isEmpty(data.dishes) ) {
                data.none = true;
            }

        });

        if ( _.isEmpty(menu) ) {
            this.catchError('no required data', {
                method: 'AppView makeOrder',
                menu: menu
            });
            return;
        }

        _.each(menu, function(data){
            if ( !order[data.date] ) {
                order[data.date] = {
                    dishes: {},
                    restaurant: false,
                    none: true
                }
            }
        });

        console.log('--- CURRENT ORDER IS (NEW)', _.clone(order), '| MenuModel',_.clone(menu));

        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: '/api/v1/order/',
            data: JSON.stringify(order),
            success: function(data){
                data.status === 'ok'
                    ? success(data)
                    : error(data);
            },
            error: error
        });
    },
    clearOrder: function(callback, order){

        var order = order.get('objects')[0],
            emptyOrder = {},
            success = function(data){
                callback && callback.call(this);
                this.setLocalData('order', null);
            },
            error = function(data){
                this.catchError('can\'t reset order', data);
            };


        if ( order && !_.isEmpty(order) ) {
            _.each(order, function(data, date){
                emptyOrder[date] = {
                    empty: true
                };
            });

            console.log('emptyOrder', emptyOrder);

            $.ajax({
                type: 'POST',
                contentType: 'application/json',
                url: '/api/v1/order/',
                data: JSON.stringify(emptyOrder),
                success: $.proxy(function(data){
                    console.log('Clear order complete', data);
                    data.status === 'ok'
                        ? success.call(this, data)
                        : error.call(this, data);
                }, this),
                error: $.proxy(error, this)
            });

        }
        else {
            callback && callback.call(this);
        }
    },
    catchError: function(message, data){

        console.error('Error: ' + message, data || null, {
            username: user.firstName + ' ' + user.lastName,
            email: user.email
        });
        alert('Error: ' + message);

        // TODO: send error

    }
});





var HeaderView = Backbone.View.extend({
    els: {},
    templates: {
        header: _.template($('#template_header').html()),
        //day: _.template($('#template_header-day').html()),
        provider: _.template($('#template_header-provider').html())
    },
    initialize: function(data){
        this.app = data.app;
        this.render();
    },
    render: function(){

        $(this.el).html(this.templates.header());

        this.els.providers = {
            container: $(config.selectors.header.providers),
            list: $(config.selectors.header.providerList)
        };

        this.els.days = {
            items: $(config.selectors.header.day),
            titles: $(config.selectors.header.dayTitle),
            actions: $(config.selectors.header.dayActionsItem),
            comments: $(config.selectors.header.dayComment)
        };

        this.els.complete = $(config.selectors.header.completeButton);
        this.els.favourites = $(config.selectors.header.favourites);

        this.app.els.page.bind('click keydown', $.proxy(function(event){

            var target =    $(event.target),
                condition = ( event.type === 'click' && !target.parents().is(config.selectors.header.day) ) ||
                            ( event.type === 'keydown' && event.which === 27 );
            condition && this.hideActions();

        }, this));
    },
    showActions: function(event){
        $(event.target)
            .parents(config.selectors.header.day)
            .addClass(config.classes.header.dayOpened);
    },
    hideActions: function(){
        console.log('HIDE ACTIONS');

        this.els.days.items
            .removeClass(config.classes.header.dayOpened);
    },
    renderDays: function(menu, menuLink){

        // temporary unused

        var days = [];

        _.each(menu, function(weekday, data){
            days.push(this.templates.day({
                weekdayRu: config.text.daysEn2Ru[ weekday ].capitalize(),
                weekday: weekday,
                comment: '',
                price: '',
                menuLink: menuLink || 'menu'
            }));
        });

        // TODO: render days
        // TODO: remove this.setDayMenuLink
    },
    bindDayEvents: function(menu){

        var methods = {
                showMenu: function(event){
                    this.hideActions();
                    this.showActions(event);
                },
                dayOrder: function(event){
                    var element = $(event.currentTarget),
                        date = element.parents(config.selectors.header.day).data('date'),
                        type = element.attr('rel'),
                        order = {
                            dishes: {},
                            restaurant: type === 'restaurant',
                            none: type === 'none'
                        };

                    this.hideActions();
                    date && this.app.addToOrder(date, order);
                    console.log('--- ACTION CLICK', date, order);
                },
                weekOrder: function(event){
                    var element = $(event.currentTarget),
                        type = element.attr('rel'),
                        order = {
                            dishes: {},
                            restaurant: type === 'restaurant',
                            none: type === 'none'
                        };

                    this.hideActions();
                    this.app.setLocalData('order', null);

                    _.each(menu, function(data, day){
                        if ( !_.isEmpty(data.providers) ) {
                            this.app.addToOrder(data.date, order);
                            this.setDayText(data.date, { type: type });
                        }
                    }, this);

                    this.setDayText('week', { type: type });

                    if ( this.app && this.app.menu && this.app.menu.renderOverlay ) {
                        this.app.menu.renderOverlay({
                            date: null,
                            day: 'week',
                            overlayType: type
                        });
                    }

                    console.log('???? RENDER OVERLAY', !!this.app.menu.renderOverlay);
                    console.log('--- WEEK ORDER', this.app.getLocalData('order'));
                }

            },
            els = {};

        this.els.days.items
            .addClass(config.classes.header.dayInactive);

        _.each(menu, function(data, day){
            this.els.days.items
                .filter('[rel="' + day + '"]')
                .data({ date: data.date })
                .removeClass(config.classes.header.dayInactive);
        }, this);

        els.days = this.els.days.items
            .not('.'+ config.classes.header.dayInactive)
            .not('[rel="week"]');

        els.week = this.els.days.items
            .filter('[rel="week"]');

        els.days
            .find(this.els.days.titles)
            .unbind('click')
            .bind('click', $.proxy(methods.showMenu, this));

        els.days
            .find(this.els.days.actions)
            .unbind('click')
            .bind('click', $.proxy(methods.dayOrder, this));

        els.week
            .removeClass(config.classes.header.dayInactive)
            .find(this.els.days.titles)
            .unbind('click')
            .bind('click', $.proxy(methods.showMenu, this));

        els.week
            .find(this.els.days.actions)
            .unbind('click')
            .bind('click', $.proxy(methods.weekOrder, this));

    },
    renderProviders: function(menu, day, provider, menuLink){

        this.els.providers.container.removeClass(config.classes.header.providersInactive);
        this.els.providers.list.empty();

        _.each(menu[day].providers, $.proxy(function(dishes, provider){
            this.els.providers.list.append(this.templates.provider({
                name: provider,
                day: day,
                menuLink: menuLink
            }));
        }, this));

        this.els.providers.items = $(config.selectors.header.provider);
        this.els.providers.names = $(config.selectors.header.providerName);

        this.els.providers.items
            .removeClass(config.classes.header.providerActive)
            .filter( provider ? '[rel="' + provider + '"]' : ':first')
            .addClass(config.classes.header.providerActive);

    },
    disableProviders: function(){

        this.els.providers.container.addClass(config.classes.header.providersInactive);
        this.els.providers.items.removeClass(config.classes.header.providerActive);
        this.els.providers.names.removeAttr('href');
    },
    toggleDay: function(day){

        this.els.days.items
            .removeClass(config.classes.header.dayActive)
            .filter('[rel="' + day + '"]')
            .addClass(config.classes.header.dayActive);

    },
    setDayText: function(date, options){

        var text = {
                office: 'в офисе',
                restaurant: 'в Луч',
                none: 'худею'
            },
            element,
            price;

        this.els.days.items.each(function(i, e){
            var day = $(e);
            if ( day.data('date') === date ) element = day;
        });

        if ( date === 'week' ) {
            element = this.els.days.items.filter('[rel="week"]');
        }

        if ( !element || ( options.type === 'office' && !options.price ) ) return;

        element
            .removeClass(config.classes.header.dayCompleted)
            .removeClass(config.classes.header.dayHasPrice)
            .find(this.els.days.comments)
            .empty();

        if ( options.type === 'clear' ) return;

        if ( options.type === 'office' && options.price ) {
            text.office += ' / ' + options.price + 'р.';
            element
                .addClass(config.classes.header.dayHasPrice)
                .find(config.selectors.header.dayPriceBig)
                .html(options.price);
        }

        element
            .addClass(config.classes.header.dayCompleted)
            .find(this.els.days.comments)
            .html(text[options.type]);

    },
    setDayMenuLink: function(menuLink){

        // TODO: refactor; render days

        this.els.days.actions.each(function(i, element){
            var el = $(element),
                type = el.attr('rel'),
                href = el.attr('href');
            href && el.attr({ href: href.replace(/menu|changeorder/, menuLink) });
        });
    },
    setHeaderMessage: function(options){

        var template,
            data;

        this.els.headerMessage = $(config.selectors.header.message);

        if ( options.type === 'menu' && !_.isEmpty(options.menu) ) {

            var dates = [],
                dataDates = {
                    from: {},
                    to: {}
                },
                dateFrom,
                dateTo;

            _.each(options.menu, function(data){
                dates.push(data.date);
            });

            dates.sort(function(a,b){
                return $.parseDate(a) < $.parseDate(b) ? -1 : 1;
            });

            dateFrom = {
                day: $.parseDate(dates[0]).getDate(),
                month: $.parseDate(dates[0]).getMonth()
            };

            dateTo = {
                day: $.parseDate(dates[ dates.length - 1 ]).getDate(),
                month: $.parseDate(dates[ dates.length - 1 ]).getMonth()
            };

            data = {
                dateFrom: dateFrom.day + ( dateFrom.month !== dateTo.month ? ' ' + config.text.monthsInflect[dateFrom.month] : '' ),
                dateTo: dateTo.day + ' ' + config.text.monthsInflect[dateTo.month],
                name: user.firstName
            };

            template = _.template(config.text.headerMessages.menu);
        }

        if ( options.type === 'favourites' ) {
            template = _.template(config.text.headerMessages.favourites);
            data = {
                name: user.firstName
            };
        }

        if ( template && data ) {
            this.els.headerMessage
                .html(template(data));
        }
    }
});




var MenuView = Backbone.View.extend({
    els: {},
    templates: {
        group: _.template($('#template_menu-group').html()),
        item: _.template($('#template_menu-item').html()),
        overlay: {
            common: _.template($('#template_overlay').html()),
            attention: _.template($('#template_overlay-attention').html())
        }
    },
    initialize: function(data){

        console.log('MENU view init', data, this.el, data.app, data.app.els.page);

        this.el = $(this.el);
        this.app = data.app;
        this.getData(this.render);
    },
    getData: function(callback){

        var menu = this.model.get('objects'),
            localOrder,
//            order = this.app && this.app.order
//                ? this.app.order.model
//                : null,
            order,
            setData = function(){

                if ( !menu || !order ) return;
                this.menu = this.assembleMenu(menu.get('objects'));
                if ( this.app && !this.app.order ) {
                    this.app.order = {
                        model: order
                    };
                }

                localOrder = this.app.getLocalData('order');

                console.log('--- SET DATA MenuView 111:', _.clone(localOrder), _.clone(order.get('objects')[0]));

                if ( !localOrder || _.isEmpty(localOrder) ) {

                    _.each(order.get('objects')[0], function(data, date){

                        var dayOrder = {},
                            dayDishes = {};

                        _.each(data.dishes, function(categories, provider){
                            _.each(categories, function(dishes, category){
                                _.each(dishes, function(dish){
                                    dayDishes[dish.id] = dish.count;
                                });
                            });
                        });

                        dayOrder = {
                            dishes: ( data.restaurant || data.none ) ? {} : dayDishes,
                            restaurant: data.restaurant,
                            none: data.none
                        };

                        if ( !dayOrder.none && _.isEmpty(dayDishes) ) {
                            dayOrder.none = true;
                        }

                        localOrder[date] = dayOrder;

                    });

                    this.app.setLocalData('order', localOrder);

                }

                console.log('--- SET DATA MenuView 222:', _.clone(localOrder), _.clone(order.get('objects')[0]));

                this.meta = order.get('meta');

//                if ( localOrder ) {
//                    this.meta.made_order = false;
//                }

                callback.call(this);
                
            };

        if ( !menu ) {
            this.app.fetchModel(this.model, function(model){
                menu = model;
                setData.call(this);
            }, this);
        }

        this.app.fetchModel(new OrderModel(), function(model){
            order = model;
            setData.call(this);
        }, this);

        setData.call(this);

    },
    assembleMenu: function(objects){

        var weekMenu = {},
            categoriesOrder = {
                primary: 0,
                secondary: 1,
                snack: 2,
                dessert: 3,
                misc: 4
            };

        _.each(objects, function(day){

            if ( _.isEmpty(day.providers) ) return;

            var weekday = config.text.daysRu2En[ $.trimAll(day.weekday) ],
                dayMenu = weekMenu[ weekday ] = {
                    providers: {},
                    date: day.date
                };

            _.each(day.providers, function(categories, provider){

                var providerMenu = dayMenu.providers[provider] = {};

                _.each(categories, function(dishes, category){

                    var categoryName = config.text.categoriesRu2En[ $.trimAll(category) ],
                        categoryMenu = providerMenu[categoryName] = {
                            name:   config.text.categoriesEn2Ru[categoryName],
                            order:  categoriesOrder[categoryName],
                            dishes: dishes
                        };

                });
            });
        });

        return weekMenu;

    },
    correctOptions: function(options){

        var menu = this.menu,
            order = [
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday'
            ],
            defaults = {
                day: options.day || 'monday',
                provider: options.provider || ''
            },
            check = function(){

                try {
                    
                    if ( menu[defaults.day] && menu[defaults.day].providers[defaults.provider] ) {
                        return;
                    }
                    else {

                        if ( menu[defaults.day] ) {
                            if ( !menu[defaults.day].providers[defaults.provider] ) {
                                for ( var provider in menu[defaults.day].providers ) {
                                    defaults.provider = provider;
                                    break;
                                }
                            }
                        }
                        else {
                            for ( var i = 0, l = order.length; i < l; i++ ) {
                                if ( menu[order[i]] ) {
                                    defaults.day = order[i];
                                    break;
                                }
                            }
                        }

                        check();
                    }
                }
                catch (e) {
                    this.app.catchError('can\'t correct options of MenuView', { error: e, menu: this.menu });
                }
            };

        check();

        return defaults;

    },
    getMenuHTML: function(menu, order, options){

        order = {};

        var menuArr = [],
            menuHTML = [];

        _.each(menu[options.day].providers[options.provider], function(item){
            menuArr.push(item);
        });

        menuArr.sort(function(a,b){
            return a.order < b.order ? -1 : 1;
        });

        _.each(menuArr, function(items){

            var groupHTML = [];

            _.each(items.dishes, function(dish){
                groupHTML.push(this.templates.item(dish));
            }, this);

            menuHTML.push(this.templates.group({
                name: items.name,
                order: items.order,
                items: groupHTML.join('')
            }));

        }, this);

        return menuHTML.join('');

    },
    checkIncompleteDays: function(order){

        var incompleteDays = this.app.header.els.days.items
                .not('.' + config.classes.header.dayInactive)
                .not('.' + config.classes.header.dayCompleted)
                .not('[rel="week"]'),
            daysEqual = true,
            previousDay,
            currentDay;

        if ( !incompleteDays.length ) {

            for ( var date in order ) {

                currentDay = order[date].restaurant
                    ? 'restaurant'
                    : order[date].none
                        ? 'none'
                        : 'office';

                if ( currentDay === 'office' ) {
                    daysEqual = false;
                    break;
                }

                if ( previousDay ) {
                    if ( previousDay !== currentDay ) {
                        daysEqual = false;
                        break;
                    }
                }
                else {
                    previousDay = currentDay;
                }
            }
        }
        else {
            daysEqual = false;
        }
        
        console.log('--- check incomplete days', incompleteDays, incompleteDays.length, daysEqual, currentDay);

        return daysEqual
            ? currentDay
            : false;

    },
    render: function(params){



        console.log('MENU view render:',
            this.menu,
            this.meta,
            this.el, _.clone(this.app.options),
            _.clone(params));




        if ( _.isEmpty(this.menu) || _.isEmpty(this.app.order.model.get('meta')) ) {
            this.app.catchError('no required data', {
                method: 'MenuView render',
                menu: this.menu,
                order: this.app.order
            });
            return;
        }

        var currentOptions = params && params.options
                    ? params.options
                    : this.app && this.app.options
                        ? this.app.options
                        : {},
            options = {
                day: currentOptions.day || this.app.els.content.data('menu-day'),
                provider: currentOptions.provider || this.app.els.content.data('menu-provider')
            },
            corrected = this.correctOptions(options),
            isDayCorrect = options.day && options.day === corrected.day,
            isProviderCorrect = options.provider && options.provider === corrected.provider,
            isOrderExpired = false,
            menuType = currentOptions.changeOrder ? 'changeorder' : 'menu',
            currentWeekOpen = this.app.order.model.get('meta').current_week_open,
            weekCompleteType;


        console.log('--- PARAMS CHANGE ORDER:', currentOptions.changeOrder, currentOptions.setFavourites);


        if_order_made: {

            if ( !_.isEmpty(this.app.order.model.get('objects')[0]) &&
                 !currentOptions.changeOrder &&
                 !currentOptions.setFavourites )
            {
                document.location.hash = '#/order/';
                return;
            }
        }

        if_current_week_closed: {

            if ( !currentWeekOpen ) {
                document.location.hash = '#/order/';
                return;
            }
        }

        if_new_week_started: {

            if ( !currentOptions.day &&
                 !currentOptions.setFavourites &&
                 _.isEmpty(this.app.order.model.get('objects')[0]) &&
                 _.isEmpty(this.app.getLocalData('order')) )
            {

                this.prepareHeader({
                    day: corrected.day,
                    provider: corrected.provider,
                    date: null
                }, menuType);

                this.renderOverlay({
                    date: null,
                    day: corrected.day,
                    overlayType: 'start'
                });

                return;
            }
        }


        this.app.header.els.days.items
            .addClass(config.classes.header.dayInactive);

        _.each(this.menu, function(data, day){
            this.app.header.els.days.items
                .filter('[rel="' + day + '"]')
                .data({ date: data.date })
                .removeClass(config.classes.header.dayInactive);
        }, this);

        _.each(this.app.getLocalData('order'), function(data, date){

            var isDayExist = false,
                orderType = data.restaurant
                    ? 'restaurant'
                    : data.none
                        ? 'none'
                        : 'office';

            for ( var day in this.menu ) {
                if ( this.menu[day].date === date ) {
                    isDayExist = true;
                    break;
                }
            }

            if ( !isDayExist ) {
                isOrderExpired = true;
            }
            else {
                this.app.header.setDayText(date, {
                    type: orderType,
                    price: this.getDayOrderPrice(date)
                });
            }

        }, this);

        weekCompleteType = this.checkIncompleteDays(this.app.getLocalData('order'));
        this.app.header.setDayText('week', { type: weekCompleteType || 'clear' });


        if_order_expired: {

            if ( isOrderExpired ) {

                this.app.clearOrder(this.app.order.model);

                this.prepareHeader({
                    day: corrected.day,
                    provider: corrected.provider,
                    date: null
                }, menuType);

                this.renderOverlay({
                    date: null,
                    day: corrected.day,
                    overlayType: 'start'
                });

                return;
            }
        }

        if_day_or_provider_are_not_specified: {

            if ( !isDayCorrect ) options.day = corrected.day;
            if ( !isProviderCorrect ) options.provider = corrected.provider;

            if ( ( !isDayCorrect || !isProviderCorrect || !currentOptions.day || !currentOptions.provider ) &&
                   !currentOptions.overlayType &&
                   !currentOptions.setFavourites )
            {
                console.log('options INCORRECT:', options.day, options.provider, '\n\n');
                document.location.hash = '#/' + menuType + '/' + options.day + '/' + options.provider + '/';
                //router.navigate('/' + menuType + '/' + options.day + '/' + options.provider + '/', { trigger: true });
                return;
            }
            else {
                console.log('options CORRECT:', options.day, options.provider, '\n\n');
            }
        }


        options.date = this.menu[options.day].date;

        this.prepareHeader({
            day: options.day,
            provider: options.provider,
            date: options.date
        }, menuType);

        this.el
            .empty()
            .append(this.getMenuHTML(this.menu, this.app.getLocalData('order'), options))
            .hide()
            .fadeIn();


        if_overlay: {

            if ( currentOptions.overlayType ) {
                this.renderOverlay({
                    date: options.date,
                    day: options.day,
                    overlayType: currentOptions.overlayType
                });
            }
        }

        if_set_favourites: {

            if ( currentOptions.setFavourites ) {

                this.confirmResetOrder({
                    callbackAgree: this.setFavouriteDishes,
                    callbackCancel: this.render,
                    menuLink: menuType
                });

                this.app.options = {
                    setFavourites: false
                };

                return;
            }
        }

        setTimeout($.proxy(function(){
            this.bindEvents.call(this, options);
        }, this), 0);

    },
    prepareHeader: function(options, menuType){

        this.el.data({ 'menu-day': options.day });
        this.el.data({ 'menu-date': options.date });
        this.el.data({ 'menu-provider': options.provider });

        this.app.header.bindDayEvents(this.menu);
        this.app.header.setDayMenuLink(menuType);
        this.app.header.renderProviders(this.menu, options.day, options.provider, menuType);
        this.app.header.toggleDay(options.day);

        this.app.header.setHeaderMessage({
            type: 'menu',
            menu: this.menu
        });

        this.app.resetPage();
        this.app.header.els.favourites
            .unbind('click')
            .click($.proxy(function(){
                this.confirmResetOrder({
                    callbackAgree: this.setFavouriteDishes,
                    callbackCancel: this.render,
                    menuLink: menuType
                });
            }, this));

    },
    bindEvents: function(options){

        this.els.item = $(config.selectors.menu.item.container);
        this.els.plus = $(config.selectors.menu.item.plus);
        this.els.minus = $(config.selectors.menu.item.minus);
        this.els.countControls = this.els.plus.add(this.els.minus);


        this.setSelectedDishes(options.date, options.day);
        this.deactivateDishes(options.date);


        this.els.item.click($.proxy(function(event){

            var selected = config.classes.menu.selected,
                els = {},
                id,
                price;

            els.element = $(event.currentTarget);
            els.target = $(event.target);
            els.number = els.element.find(config.selectors.menu.item.number);
            els.count = els.element.find(config.selectors.menu.item.count);
            els.price = els.element.find(config.selectors.menu.item.price);
            id = els.element.data('id');
            price = +els.price.html();

            if ( els.target.is(els.number) ) return;
            if ( !els.element.hasClass(selected) && price > config.DAY_ORDER_LIMIT - this.getDayOrderPrice(options.date) ) {
                return;
            }

            if ( els.element.hasClass(selected) ) {
                this.app.removeDishFromOrder(options.date, id);
                els.element.removeClass(selected);
                els.count.addClass(config.classes.menu.countOne);
                els.number.html(0);
            }
            else {

                this.app.addToOrder(options.date, {
                    dish: {
                        id: id,
                        count: 1
                    }
                });

                els.element.addClass(selected);
            }

            this.app.header.setDayText(options.date, {
                type: 'office',
                price: this.getDayOrderPrice(options.date)
            });

            this.deactivateDishes(options.date);

        }, this));


        this.els.countControls.click($.proxy(function(event){

            var els = {},
                count = {},
                id,
                price;

            els.button = $(event.currentTarget);
            els.container = els.button.parents(config.selectors.menu.item.container);
            els.count = els.container.find(config.selectors.menu.item.count);
            els.number = els.count.find(config.selectors.menu.item.number);
            els.price = els.container.find(config.selectors.menu.item.price);
            id = els.container.data('id');
            price = +els.price.html();

            count.original = +els.number.html() || 1;
            count.increment = count.original < 9 ? count.original + 1 : 9;
            count.decrement = count.original > 1 ? count.original - 1 : 1;
            count.changed = els.button.is(config.selectors.menu.item.plus)
                ? count.increment
                : count.decrement;

            if ( els.button.is(config.selectors.menu.item.plus) && price > config.DAY_ORDER_LIMIT - this.getDayOrderPrice(options.date) ) {
                return false;
            }

            this.app.addToOrder(options.date, {
                dish: {
                    id: id,
                    count: count.changed
                }
            });

            count.changed > 1
                ? els.count.removeClass(config.classes.menu.countOne)
                : els.count.addClass(config.classes.menu.countOne);

            els.number.html(count.changed);

            this.app.header.setDayText(options.date, {
                type: 'office',
                price: this.getDayOrderPrice(options.date)
            });

            this.deactivateDishes(options.date);
            event.stopPropagation();

        }, this));

    },
    setSelectedDishes: function(date, day){

        //if ( !this.app || !this.app.order || !this.app.order.model ) return;

        var order = this.app.getLocalData('order');

        if ( _.isEmpty(order[date]) ) return;

        if ( order[date].restaurant || order[date].none ) {

            var type = order[date].restaurant
                    ? 'restaurant'
                    : order[date].none
                        ? 'none'
                        : '';

            console.log('--- set selected dishes 1: render overlay', order[date].restaurant, order[date].none);

            this.renderOverlay({
                date: date,
                day: day,
                overlayType: type
            });

            this.app.header.setDayText(date, { type: type });

        }
        else {

            this.els.item = $(config.selectors.menu.item.container);

            if ( order[date] && order[date].dishes ) {

                console.log('--- set selected dishes 2: local data', order[date].dishes);

                _.each(order[date].dishes, function(count, id){

                    var element = this.els.item.filter('[data-id=' + id + ']');

                    if ( !element.length ) return;

                    element
                        .addClass(config.classes.menu.selected)
                        .find(config.selectors.menu.item.number)
                        .html(count);

                    count > 1
                        && element
                            .find(config.selectors.menu.item.count)
                            .removeClass(config.classes.menu.countOne);

                }, this);
            }
            else if ( order[date] && order[date].providers ) {

                console.log('--- set selected dishes 3: DB data', order[date].providers);

                _.each(order[date].providers, function(categories, provider){
                    _.each(categories, function(dishes, category){
                        _.each(dishes, function(dish){

                            var element = this.els.item.filter('[data-id=' + dish.id + ']');

                            if ( !element.length ) return;

                            element
                                .addClass(config.classes.menu.selected)
                                .find(config.selectors.menu.item.number)
                                .html(dish.count);

                            dish.count > 1
                                && element
                                    .find(config.selectors.menu.item.count)
                                    .removeClass(config.classes.menu.countOne);

                        }, this);
                    }, this);
                }, this);
            }

            this.app.header.setDayText(date, {
                type: 'office',
                price: this.getDayOrderPrice(date)
            });
        }
    },
    setFavouriteDishes: function(){

        var favourites = {
                favourite: {},
                others: {}
            },
            order = {};

        _.each(this.menu, function(menu, day){
            _.each(menu.providers, function(categories, provider){
                _.each(categories, function(category, categoryName){

                    if ( categoryName === 'misc' ) return;

                    _.each(category.dishes, function(dish){
                        
                        favourites.favourite[menu.date] = favourites.favourite[menu.date] || {};
                        favourites.favourite[menu.date][categoryName] = favourites.favourite[menu.date][categoryName] || [];

                        favourites.others[menu.date] = favourites.others[menu.date] || {};
                        favourites.others[menu.date][categoryName] = favourites.others[menu.date][categoryName] || [];

                        dish.favorite
                            ? favourites.favourite[menu.date][categoryName].push(_.extend({ category: categoryName}, dish))
                            : favourites.others[menu.date][categoryName].push(_.extend({ category: categoryName }, dish));

                    });
                });
            });
        });

        _.each(favourites.favourite, function(categories, date){
            _.each(categories, function(dishes, category){

                var id, others;

                if ( !order[date] ) {
                    order[date] = {
                        dishes: {},
                        restaurant: false,
                        none: false
                    };
                }

                if ( dishes.length ) {
                    id = dishes[ $.random( dishes.length - 1 ) ].id;
                    order[date].dishes[id] = 1;
                }
                else {
                    others = favourites.others[date][category];
                    id = others[ $.random( others.length - 1 ) ].id;
                    order[date].dishes[id] = 1;
                }
            });
        });

        console.log('--- set favourite dishes', _.clone(order));
        this.app.setLocalData('order', order);
        this.render();

    },
    renderOverlay: function(options){

        var content,
            template = this.templates.overlay.common,
            order = {},
            weekOrDay = options.day === 'week' ? 'week' : 'day',
            weekCompleteType,
            text = {
                start: {
                    message: 'Начните ',
                    days: config.text.daysEn2RuInflect2,
                    link: {},
                    className: config.classes.overlay.start
                },
                none: {
                    message: 'Худею ',
                    link: {
                        href: 'http://ru.wikipedia.org/wiki/Диета',
                        text: 'Худейте правильно!'
                    },
                    days: config.text.daysEn2RuInflect1,
                    className: config.classes.overlay.none[weekOrDay]
                },
                restaurant: {
                    message: 'Луч гламура ',
                    link: {
                        href: 'http://goo.gl/KU6eY',
                        text: 'Где это клёвое место?'
                    },
                    days: config.text.daysEn2RuInflect1,
                    className: config.classes.overlay.restaurant[weekOrDay]
                }
            };

        if ( !options.overlayType || !options.day ) {
            this.app.catchError('no required overlay params', options);
            return;
        }

        template = this.templates.overlay.common;
        content = {
            className: text[options.overlayType].className,
            message: text[options.overlayType].message + text[options.overlayType].days[options.day],
            link: {
                href: text[options.overlayType].link.href || '',
                text: text[options.overlayType].link.text || ''
            }
        };

        if ( ( options.overlayType === 'restaurant' || options.overlayType === 'none' ) && options.date ) {

            order[options.overlayType] = true;
            this.app.addToOrder(options.date, order);
            this.app.header.setDayText(options.date, { type: options.overlayType });

            weekCompleteType = this.checkIncompleteDays(this.app.getLocalData('order'));
            this.app.header.setDayText('week', { type: weekCompleteType || 'clear' });

        }

        this.app.header.disableProviders();

        this.el
            .find(config.selectors.overlay)
            .remove()
            .end()
            .append(template(content));

    },
    deactivateDishes: function(date){

        this.els.item
            .removeClass(config.classes.menu.inactive)
            .not('.' + config.classes.menu.selected)
            .each($.proxy(function(i, e){

                var element = $(e),
                    price = +element.find(config.selectors.menu.item.price).html();

                if ( price > config.DAY_ORDER_LIMIT - this.getDayOrderPrice(date) ) {
                    element.addClass(config.classes.menu.inactive);
                }

        }, this));
    },
    getDayOrderPrice: function(date){

        var order = this.app.getLocalData('order')[date],
            price = 0,
            dayMenu;

        if ( !order ) return 0;

        _.each(this.menu, function(data, day){
            if ( date === data.date ) {
                dayMenu = data;
            }
        });

        _.each(dayMenu.providers, function(categories, provider){
            _.each(categories, function(categoryData, category){
                _.each(categoryData.dishes, function(dish){
                    if ( order.dishes[dish.id] ) {
                        price += ( +dish.price * order.dishes[dish.id] );
                    }
                });
            });
        });

        return price;
    },
    clearOrder222: function(callback){

        var emptyOrder = {},
            success = $.proxy(function(data){
                console.log('reset order OK', data);
                callback && callback.call(this);
            }, this),
            error = $.proxy(function(data){
                this.app.catchError('can\'t reset order', data);
            }, this);

        if ( this.app.order && this.app.order.model && this.app.order.model.get('objects').length ) {
            _.each(this.app.order.model.get('objects')[0], function(data, date){
                emptyOrder[date] = {
                    empty: true
                };
            });
        }
        
        console.log('--- REMOVE LOCAL ORDER: empty order', emptyOrder, JSON.stringify(emptyOrder));
        this.app.setLocalData('order', null);

        if ( !_.isEmpty(emptyOrder) ) {
            $.ajax({
                type: 'POST',
                contentType: 'application/json',
                url: '/api/v1/order/',
                data: JSON.stringify(emptyOrder),
                success: function(data){
                    data.status === 'ok'
                        ? success(data)
                        : error(data);
                },
                error: error
            });
        }

    },
    confirmResetOrder: function(options){

        var provider = this.app.els.wrapper.data('menu-provider'),
            day = this.app.els.wrapper.data('menu-day');

        this.app.header.disableProviders();

        this.el
            .find(config.selectors.overlay)
            .remove()
            .end()
            .append(this.templates.overlay.attention());

        setTimeout($.proxy(function(){

            this.els.attention = {
                container: $(config.selectors.overlay),
                confirm: $(config.selectors.attention.confirm),
                cancel: $(config.selectors.attention.cancel)
            };

            this.els.attention.confirm.click($.proxy(function(event){
                this.els.attention.container.remove();
                //this.app.header.renderProviders(this.menu, day, provider, options.menuLink);
                options.callbackAgree.call(this);
            }, this));

            this.els.attention.cancel.click($.proxy(function(event){
                this.els.attention.container.remove();
                //this.app.header.renderProviders(this.menu, day, provider, options.menuLink);
                options.callbackCancel.call(this);
            }, this));

        }, this), 0);

    }
});




var OrderView = Backbone.View.extend({
    els: {},
    templates: {
        dishes: _.template($('#template_order-group-dishes').html()),
        message: _.template($('#template_order-group-message').html()),
        item: _.template($('#template_menu-item').html())
    },
    initialize: function(data){

        console.log('ORDER view initialize', arguments);

        this.el = $(this.el);
        this.app = data.app;
        this.getData(this.render);
    },
    getData: function(callback){

        var order,
            meta,
            localOrder,
            menu = this.app && this.app.menu
                ? this.app.menu.model
                : null,
            setData = function(){

                console.log('--- SET DATA', order, menu);

                if ( !menu || !order ) return;

                localOrder = this.app.getLocalData('order');

                console.warn('order view:', localOrder && !_.isEmpty(localOrder) ? 'local' : 'server', localOrder, order.get('objects')[0]);

                this.order = this.assembleOrder( localOrder && !_.isEmpty(localOrder) ? localOrder : order.get('objects')[0], menu.get('objects'));
                this.meta = meta;

                //this.meta.current_week_open = false;

                if ( this.app && !this.app.menu ) {
                    this.app.menu = {
                        model: menu
                    };
                }

                console.log('--- SET DATA OrderView 111:', _.clone(localOrder), _.clone(order.get('objects')[0]));

                if ( !localOrder || _.isEmpty(localOrder) ) {

                    _.each(order.get('objects')[0], function(data, date){

                        var dayOrder = {},
                            dayDishes = {};

                        _.each(data.dishes, function(categories, provider){
                            _.each(categories, function(dishes, category){
                                _.each(dishes, function(dish){
                                    dayDishes[dish.id] = dish.count;
                                });
                            });
                        });

                        dayOrder = {
                            dishes: ( data.restaurant || data.none ) ? {} : dayDishes,
                            restaurant: data.restaurant,
                            none: data.none
                        };

                        if ( !dayOrder.none && _.isEmpty(dayDishes) ) {
                            dayOrder.none = true;
                        }

                        localOrder[date] = dayOrder;

                    });

                    this.app.setLocalData('order', localOrder);

                }

                console.log('--- SET DATA OrderView 222:', _.clone(localOrder), _.clone(order.get('objects')[0]));

                callback.call(this);

            };

//        if ( !order || !order.length ) {
//            this.app.fetchModel(this.model, function(model){
//                order = model.get('objects');
//                setData.call(this);
//            }, this);
//        }



        this.app.fetchModel(this.model, function(model){

            order = model;
            //order = model.get('objects')[0];
            meta = model.get('meta');
            setData.call(this);
        }, this);



        if ( !menu ) {
            this.app.fetchModel(new MenuModel(), function(model){
                menu = model;
                setData.call(this);
            }, this);
        }

        setData.call(this);

    },
    assembleOrder: function(objects, menu){

        console.log('--- ASSEMBLE ORDER', objects, menu);

        if ( _.isEmpty(objects) ) return;

        var days = {},
            sorted = [];

        _.each(menu, function(data){

            var date = data.date,
                order = objects[date];

            days[date] = {
                date: date,
                weekday: data.weekday,
                weekdayEn: config.text.daysRu2En[ $.trimAll(data.weekday) ],
                dishes: [],
                restaurant: false,
                none: true
            };

            if ( order ) {

                days[date].restaurant = order.restaurant;
                days[date].none = order.none;

                if ( _.isEmpty(order.dishes) && !order.restaurant ) {
                    days[date].none = true;
                }

                if ( order && !order.restaurant && !order.none ) {

                    if ( order.weekday ) {

                        // model from server

                        _.each(order.dishes, function(categories, provider){
                            _.each(categories, function(dishes, category){
                                _.each(dishes, function(dish){
                                    days[data.date].dishes.push({
                                        name: dish.name,
                                        count: +dish.count,
                                        price: +dish.price,
                                        id: dish.id,
                                        provider: provider,
                                        category: config.text.categoriesEn2Ru[ config.text.categoriesRu2En[ $.trimAll(category) ] ]
                                    });
                                });
                            });
                        });

                        console.log('--- ORDER FROM SERVER');

                    }
                    else {

                        // model from local storage

                        _.each(data.providers, function(categories, provider){
                            _.each(categories, function(dishes, category){
                                _.each(dishes, function(dish){
                                    if ( order.dishes[dish.id] ) {
                                        days[data.date].dishes.push({
                                            name: dish.name,
                                            count: order.dishes[dish.id],
                                            price: +dish.price,
                                            id: dish.id,
                                            provider: provider,
                                            category: config.text.categoriesEn2Ru[ config.text.categoriesRu2En[ $.trimAll(category) ] ]
                                        });
                                    }
                                });
                            });
                        });

                        console.log('--- ORDER FROM LOCAL STORAGE');
                        
                    }
                }
            }
        });


        console.log('--- DAYS', _.clone(days));

        _.each(days, function(data){
            sorted.push(data);
        });

        sorted.sort(function(a ,b){
            return +$.parseDate(a.date) < +$.parseDate(b.date) ? -1 : 1;
        });

        return sorted;

    },
    render: function(){


        console.log('ORDER view render', this.order);

        if ( ( !this.order || !this.order.length ) && this.meta.current_week_open ) {
            document.location.hash = '#/menu/';
            return;
        }

        if ( !( this.app.menu && this.app.menu.model && !_.isEmpty(this.app.menu.model.get('objects')) ) ) {
            this.app.catchError('no required data', {
                method: 'OrderView render',
                menu: this.app.menu,
                order: this.order
            });
            return;
        }

        var orderHTML = [];

        _.each(this.order, function(data){

            var dayHTML = [],
                dayPrice = 0,
                hasDishes = !data.restaurant && !data.none,
                template,
                content;

            _.each(data.dishes, function(dish){
                dayHTML.push(this.templates.item(_.extend({ showCount: dish.count > 1 }, dish)));
                dayPrice += dish.price * dish.count;
            }, this);


            if ( hasDishes ) {

                template = this.templates.dishes;
                content = {
                    date: data.date,
                    day: data.weekday.capitalize(),
                    price: dayPrice,
                    dishes: dayHTML.join('')
                };
            }
            else {

                var className = data.restaurant
                        ? config.classes.order.restaurant
                        : data.none
                            ? config.classes.order.none
                            : '',
                    message = data.restaurant
                        ? 'Луч гламура '
                        : data.none
                            ? 'Худею '
                            : '';

                template = this.templates.message;
                content = {
                    date: data.date,
                    day: data.weekday.capitalize(),
                    message: message + config.text.daysEn2RuInflect1[data.weekdayEn],
                    className: className
                };
            }

            orderHTML.push(template(content));

        }, this);


        this.els.changeButton = $(config.selectors.header.changeOrder);
        this.els.changeButton.removeClass(config.classes.global.hidden);

        if ( !this.meta.current_week_open ) {
            this.els.changeButton.addClass(config.classes.global.hidden);
        }

        this.app.header.setHeaderMessage({
            type: 'menu',
            menu: this.app.menu.model.get('objects')
        });

        this.app.resetPage();


        this.app.clearOrder($.proxy(function(){
            this.app.makeOrder(this.app.menu.model.get('objects'));
        }, this), this.model);

        //this.app.makeOrder(this.app.menu.model.get('objects'));
        //this.app.setLocalData('order', null);

        this.el
            .empty()
            .addClass(config.classes.content.order)
            .html(orderHTML.join(''))
            .hide()
            .fadeIn();

        this.app.els.page.addClass(config.classes.page.order);

    }
});




var FavouritesView = Backbone.View.extend({
    els: {},
    templates: {
        container: _.template($('#template_favourites').html()),
        category: _.template($('#template_favourites-category').html()),
        item: _.template($('#template_favourites-item').html())
    },
    initialize: function(data){

        console.log('FAVOURITES view initialize', this.model, this.model.get('objects'));

        this.app = data.app;
        this.el = $(this.el);
        this.getData(this.render);
    },
    getData: function(callback){

        var favourites = this.model.get('objects');

        if ( !favourites || !favourites.length ) {
            this.app.fetchModel(this.model, function(model){
                this.favourites = this.assertFavourites(model.get('objects'));
                callback.call(this);
            }, this);
        }
    },
    assertFavourites: function(objects){

        var favourites = {};

        _.each(objects, function(dish){

            var category = config.text.categoriesRu2En[dish.group];

            if ( !favourites[category] ) {
                favourites[category] = {
                    name: config.text.categoriesEn2RuShort[category],
                    dishes: []
                };
            }

            favourites[category].dishes.push(dish);

        });

        return favourites;
    },
    render: function(){

        console.log('FAVOURITES view render:', this.favourites);

        if ( !this.favourites ) return;

        var favourites = [];

        _.each(this.favourites, function(data, categoryName){

            var category = [];

            _.each(data.dishes, function(dish){
                category.push(this.templates.item({
                    name: dish.name,
                    provider: dish.provider,
                    id: dish.id,
                    isSelected: dish.favorite
                }));
            }, this);

            favourites.push(this.templates.category({
                name: data.name,
                category: categoryName,
                items: category.join('')
            }));

        }, this);

        
        this.app.header.setHeaderMessage({
            type: 'favourites'
        });

        this.app.resetPage();

        this.el
            .empty()
            .addClass(config.classes.content.favourites)
            .append(this.templates.container({ categories: favourites.join('') }))
            .hide()
            .fadeIn();

        this.app.els.page.addClass(config.classes.page.favourites);
        setTimeout($.proxy(this.bindEvents, this), 0);

    },
    bindEvents: function(){

        this.els.item = $(config.selectors.favourites.item);
        this.els.save = $(config.selectors.favourites.save);
        this.els.order = $(config.selectors.favourites.order);

        this.slideColumns();
        this.els.save.click($.proxy(this.saveFavourites, this));
        this.els.item.click($.proxy(function(event){

            var element = $(event.currentTarget),
                selected = element.hasClass(config.classes.favourites.selected);

            selected
                ? element.removeClass(config.classes.favourites.selected)
                : element.addClass(config.classes.favourites.selected);

        }, this));

        this.els.order.click($.proxy(function(){

            this.app.options = {
                setFavourites: true
            };

            this.app.menu = new MenuView({
                model: new MenuModel(),
                el: this.app.els.wrapper,
                app: this.app
            });

        }, this));

    },
    slideColumns: function(){

        var MINIMAL_WIDTH = 1700,
            timer = false,
            toggle = function(event){

                if ( timer ) return false;
                timer = true;

                setTimeout($.proxy(function(){

                    var width = event ? $(event.currentTarget).width() : $(window).width(),
                        collapsed = this.el.hasClass(config.classes.favourites.slider);

                    timer = false;

                    if ( width < MINIMAL_WIDTH && !collapsed ) {

                        this.el.addClass(config.classes.favourites.slider);

                        this.els.category
                            .first()
                            .add(this.els.category.last())
                            .addClass(config.classes.favourites.collapsed);

                        this.els.blank.click($.proxy(function(event){

                            var index = $(event.currentTarget).parent().index(),
                                last = this.els.category.length - 1,
                                slides,
                                els = {
                                    collapsed: $(),
                                    expanded: $()
                                };

                            switch (index) {
                                case 0:
                                    slides = [last, last - 1];
                                    break;
                                case last:
                                    slides = [0, 1];
                                    break;
                                default:
                                    slides = [0, last]
                            }

                            _.each(slides, function(i){
                                els.collapsed = els.collapsed.add(this.els.category.eq(i));
                            }, this);

                            els.collapsed.addClass(config.classes.favourites.collapsed);
                            els.expanded = this.els.category
                                .not(els.collapsed)
                                .removeClass(config.classes.favourites.collapsed);

                        }, this));

                    }

                    if ( width >= MINIMAL_WIDTH && collapsed ) {

                        this.el.removeClass(config.classes.favourites.slider);
                        this.els.category.removeClass(config.classes.favourites.collapsed);
                        this.els.blank.unbind('click');

                    }
                    
                }, this), 100);
            };

        this.els.category = $(config.selectors.favourites.category);
        this.els.blank = $(config.selectors.favourites.blank);

        toggle.call(this);
        $(window).resize($.proxy(toggle, this));

    },
    saveFavourites: function(){

        var favourites = [],
            success = $.proxy(function(data){
                console.log('favourites OK', data);
            }, this),
            error = $.proxy(function(data){
                this.app.catchError('can\'t save favourites', data);
            }, this);

        this.els.item
            .filter('.' + config.classes.favourites.selected)
            .each(function(i, element){
                favourites.push( $(element).data('id') );
            });

        console.log('FAVOURITES SAVE', favourites.slice());

        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: '/api/v1/favorite/',
            data: JSON.stringify({ objects: favourites }),
            success: function(data){
                data.status === 'ok'
                    ? success(data)
                    : error(data);
            },
            error: error
        });

    }
});
