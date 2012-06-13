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
                console.log('FETCH MODEL ERROR', error);
            }
        });
    },
    getLocalData: function(key){

        var value;

        if ( typeof localStorage === 'undefined' ) {
            console.log('ERROR: local storage is not supported');
            return;
        }

        try {
            var data = JSON.parse(localStorage.getItem(key));
            value = data instanceof Object ? data : {};
        }
        catch (e) {
            console.log('ERROR: invalid data is in local storage');
            value = {};
        }

        //console.log('GET LOCAL DATA', _.clone(value));

        return value;

    },
    setLocalData: function(key, value){

        if ( typeof localStorage == 'undefined' ) {
            console.log('ERROR: local storage is not supported');
            return;
        }

        //console.log('SET LOCAL DATA', value);

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
    makeOrder: function(){

        var order = this.getLocalData('order'),
            week = {},
            success = function(data){
                console.log('order OK', data);
            },
            error = function(data){
                console.log('order FAIL', data);
            };

        _.each(order, function(data, date){

            if ( data.restaurant || data.none ) {
                data.dishes = {}
            }

            if ( !data.restaurant && _.isEmpty(data.dishes) ) {
                data.none = true;
            }

        });


        if ( this.app && this.app.menu ) {
            _.each(this.app.menu.menu, function(data, day){
                if ( !order[data.date] ) {
                    order[data.date] = {
                        dishes: {},
                        restaurant: false,
                        none: true
                    }
                }
            });
        }
        

        console.log('--- ORDERED', _.clone(order));

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
    }
});





var HeaderView = Backbone.View.extend({
    els: {},
    templates: {
        header: _.template($('#template_header').html()),
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

        this.app.els.page.bind('click keydown', $.proxy(function(event){

            var target =    $(event.target),
                condition = ( event.type === 'click' && !target.parents().is(config.selectors.header.day) ) ||
                            ( event.type === 'keydown' && event.which === 27 );
            condition && this.hideActions();

        }, this));

        this.els.days.actions.click($.proxy(this.hideActions, this));

    },
    showActions: function(event){
        $(event.target)
            .parents(config.selectors.header.day)
            .addClass(config.classes.header.dayOpened);
    },
    hideActions: function(){
        this.els.days.items
            .removeClass(config.classes.header.dayOpened);
    },
    bindDayEvents: function(menu){

        var _this = this,
            itemsClick = function(event){
                _this.hideActions();
                _this.showActions(event);
            },
            titlesClick = function(event){
                var element = $(event.currentTarget),
                    date = element.parents(config.selectors.header.day).data('date'),
                    type = element.attr('rel'),
                    order = {
                        dishes: {},
                        restaurant: type === 'restaurant',
                        none: type === 'none'
                    };

                _this.app.addToOrder(date, order);
                console.log('--- ACTION CLICK', date, order);
            };

        this.els.days.items
            .addClass(config.classes.header.dayInactive);

        _.each(menu, function(data, day){
            this.els.days.items
                .filter('[rel="' + day + '"]')
                .data({ date: data.date })
                .removeClass(config.classes.header.dayInactive);
        }, this);

        this.els.days.items
            .not('.'+ config.classes.header.dayInactive)
            .find(this.els.days.titles)
            .unbind('click', itemsClick)
            .bind('click', itemsClick);

        this.els.days.items
            .not('.'+ config.classes.header.dayInactive)
            .find(this.els.days.actions)
            .unbind('click', titlesClick)
            .bind('click', titlesClick);

    },
    renderProviders: function(menu, day, provider){

        this.els.providers.container.removeClass(config.classes.header.providersInactive);
        this.els.providers.list.empty();

        _.each(menu[day].providers, $.proxy(function(dishes, provider){
            this.els.providers.list.append(this.templates.provider({
                name: provider,
                day: day
            }));
        }, this));

        this.els.providers.items = $(config.selectors.header.provider);
        this.els.providers.names = $(config.selectors.header.providerName);

        this.els.providers.items
            .removeClass(config.classes.header.providerActive)
            .filter('[rel="' + provider + '"]')
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
            localOrder = this.app.getLocalData('order'),
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

                    console.log('--- NEW LOCAL ORDER: MenuView', _.clone(localOrder));
                    this.app.setLocalData('order', localOrder);

                }
                
                this.app.header.bindDayEvents(this.menu);
                callback.call(this);
                
            };

        if ( !menu ) {
            this.app.fetchModel(this.model, function(model){
                menu = model;
                setData.call(this);
            }, this);
        }

        this.app.fetchModel(new OrderModel(), function(model){
            //order = model.get('objects')[0];
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


        //console.log('-- getMenuHTML', menuArr);

        _.each(menuArr, function(items){

            var groupHTML = [];

            _.each(items.dishes, function(dish){ // TODO: get order

                if ( !_.isEmpty(order) && order[options.date] && order[options.date].dishes[dish.id] ) {
                    dish.isSelected = this.order[options.date].dishes[dish.id];
                    dish.count = this.order[options.date].dishes[dish.id];
                }

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
    render: function(params){

        console.log('MENU view render:',  this.menu, this.app.order.model.attributes, this.el, _.clone(this.app.options), _.clone(params));

        if ( !this.menu || _.isEmpty(this.menu) ) return;





        

        var currentOptions = params && params.options // TODO: fix
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
            isProviderCorrect = options.provider && options.provider === corrected.provider;


        if ( !isDayCorrect ) options.day = corrected.day;
        if ( !isProviderCorrect ) options.provider = corrected.provider;

        if ( ( !isDayCorrect || !isProviderCorrect || !currentOptions.day || !currentOptions.provider ) && !currentOptions.overlayType ) {
            console.log('options INCORRECT:', options.day, options.provider, '\n\n');
            document.location.hash = '#/menu/' + options.day + '/' + options.provider + '/';
            //router.navigate('menu/' + options.day + '/' + options.provider + '/', { trigger: true });
            return;
        }
        else {
            console.log('options CORRECT:', options.day, options.provider, '\n\n');
        }



        var isLocalOrderExpired = false;

        _.each(this.app.getLocalData('order'), function(data, date){

            var isDayExist = false,
                type;

//            _.each(this.menu, function(data, day){
//                isDayExist = data.date === date;
//            });

            for ( var day in this.menu ) {
                if ( this.menu[day].date === date ) {
                    isDayExist = true;
                    break;
                }
            }

            console.log('--- lol', data, date, isDayExist);

            if ( isDayExist ) {

                type = data.restaurant
                    ? 'restaurant'
                    : data.none
                        ? 'none'
                        : 'office';
    
                this.setHeaderDayText(date, { type: type });
            }
            else {
                isLocalOrderExpired = true;
            }

        }, this);


        if ( isLocalOrderExpired ) {

            var fakeOrder = {};

            _.each(this.menu, function(data, day){
                fakeOrder[data.date] = {
                    dishes: {},
                    restaurant: false,
                    none: true
                };
            });

            console.log('--- fake order', fakeOrder);
            console.log('REMOVE LOCAL ORDER');

            this.app.setLocalData('order', null);


            var success = function(data){
                console.log('333 order OK', data);
            },
            error = function(data){
                console.log('333 order FAIL', data);
            };


            $.ajax({
                type: 'POST',
                contentType: 'application/json',
                url: '/api/v1/order/',
                data: JSON.stringify(fakeOrder),
                success: function(data){
                    data.status === 'ok'
                        ? success(data)
                        : error(data);
                },
                error: error
            });

        }





        options.date = this.menu[options.day].date;

        this.app.header.renderProviders(this.menu, options.day, options.provider);
        this.app.header.toggleDay(options.day);

        this.el.data({ 'menu-day': options.day });
        this.el.data({ 'menu-date': options.date });
        this.el.data({ 'menu-provider': options.provider });

        this.app.resetPage();

        this.el
            .empty()
            .append(this.getMenuHTML(this.menu, this.app.getLocalData('order'), options))
            .hide()
            .fadeIn();

        if ( currentOptions.overlayType ) {
            this.renderOverlay({
                date: options.date,
                day: options.day,
                overlayType: currentOptions.overlayType
            });
        }

        setTimeout($.proxy(function(){
            this.setSelectedDishes.call(this, options.date, options.day);
            this.bindEventsForOrder.call(this, options.date);
        }, this), 0);

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

            this.setHeaderDayText(date, { type: type });
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

            this.deactivateDishes(date);
            this.setHeaderDayText(date, { type: 'office' });
        }
    },
    setFavouriteDishes: function(){

        var favourites = {
                favourite: {},
                others: {}
            };

        window.fCount = 0;

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


//                        if ( dish.favorite ) {
//
////                            if ( !favourites.favourite[menu.date] ) {
////                                favourites.favourite[menu.date] = {};
////                            }
////
////                            if ( !favourites.favourite[menu.date][categoryName] ) {
////                                favourites.favourite[menu.date][categoryName] = [];
////                            }
//
//                            favourites.favourite[menu.date][categoryName].push(_.extend({ provider: provider }, dish));
//                        }
//                        else {
//                            favourites.others[menu.date][categoryName].push(_.extend({ provider: provider }, dish));
//                        }

                    });
                });
            });
        });

        var f = {
            '2012-06-12': {
                'primary': []
            }
        };


        window.blabla = _.clone(favourites);


        var selected = {},
            localData = [];


        _.each(favourites.favourite, function(categories, date){
            _.each(categories, function(dishes, category){

                if ( !selected[date] ) {
                    selected[date] = [];
                }

                if ( dishes.length ) {
                    selected[date].push( dishes[ $.random( dishes.length - 1 ) ] );
                }
                else {
                    var others = favourites.others[date][category];
                    selected[date].push( others[ $.random( others.length - 1 ) ] );
                }
            });
        });

        window.zzz = _.clone(selected);

        return _.clone(selected);





//        _.each(favourites, function(providers, date){
//
//            _.each(providers, function(dishes, category){
//
//
////                _.each(dishes, function(dish){
////
////                });
//
//
//                if ( !selected[date] ) {
//                    selected[date] = [];
//                }
//
//                if ( dishes.length ) {
//                    selected[date].push( dishes.eq( $.random( dishes.length - 1 ) ) );
//                }
//                else {
//
//                }
//
//            });
//
//
//        });


    },
    bindEventsForOrder: function(date){

        this.els.item = $(config.selectors.menu.item.container);
        this.els.plus = $(config.selectors.menu.item.plus);
        this.els.minus = $(config.selectors.menu.item.minus);
        this.els.countControls = this.els.plus.add(this.els.minus);


        this.els.item.click($.proxy(function(event){

            var selected = config.classes.menu.selected,
                element = $(event.currentTarget),
                id = element.data('id'),
                target = $(event.target),
                number = element.find(config.selectors.menu.item.number);

            if ( target.is(number) ) return;

            if ( element.hasClass(selected) ) {
                this.app.removeDishFromOrder(date, id);
                element.removeClass(selected);
            }
            else {

                this.app.addToOrder(date, {
                    dish: {
                        id: id,
                        count: 1
                    }
                });

                element.addClass(selected);
            }

            this.setHeaderDayText(date, { type: 'office' });
            this.deactivateDishes(date);

        }, this));


        this.els.countControls.click($.proxy(function(event){

            var els = {},
                count = {},
                id;

            els.button = $(event.currentTarget);
            els.container = els.button.parents(config.selectors.menu.item.container);
            els.count = els.container.find(config.selectors.menu.item.count);
            els.number = els.count.find(config.selectors.menu.item.number);
            id = els.container.data('id');

            count.original = +els.number.html() || 1;
            count.increment = count.original < 9 ? count.original + 1 : 9;
            count.decrement = count.original > 1 ? count.original - 1 : 1;
            count.changed = els.button.is(config.selectors.menu.item.plus)
                ? count.increment
                : count.decrement;

            this.app.addToOrder(date, {
                dish: {
                    id: id,
                    count: count.changed
                }
            });

            count.changed > 1
                ? els.count.removeClass(config.classes.menu.countOne)
                : els.count.addClass(config.classes.menu.countOne);

            els.number.html(count.changed);

            this.setHeaderDayText(date, { type: 'office' });
            this.deactivateDishes(date);
            event.stopPropagation();

        }, this));

    },
    renderOverlay: function(options){

        var content,
            template = this.templates.overlay.common,
            text = {
                start: {
                    message: 'Начните ',
                    days: config.text.daysEn2RuInflect2
                },
                none: {
                    message: 'Худею ',
                    link: {
                        href: 'http://ru.wikipedia.org/wiki/Диета',
                        text: 'Худейте правильно!'
                    },
                    days: config.text.daysEn2RuInflect1
                },
                restaurant: {
                    message: 'Луч гламура ',
                    link: {
                        href: 'http://goo.gl/KU6eY',
                        text: 'Где это клёвое место?'
                    },
                    days: config.text.daysEn2RuInflect1
                },
                attention: {
                    message: 'Ахтунг!'
                }
            };


        if ( !options.overlayType || !options.day ) { // TODO: don't forget attention overlay
            alert('overlay error: ' + options.overlayType + ' -- ' + options.day);
            return;
        }


        if ( options.overlayType === 'restaurant' || options.overlayType === 'none' ) {
            var dayOrderData = {};
            dayOrderData[options.overlayType] = true;
            this.app.addToOrder(options.date, dayOrderData);
            this.setHeaderDayText(options.date, { type: options.overlayType });
        }

        content = {
            className: config.classes.overlay[options.overlayType][ options.day === 'week' ? 'week' : 'day' ],
            message: text[options.overlayType].message + text[options.overlayType].days[options.day],
            link: {
                href: text[options.overlayType].link.href,
                text: text[options.overlayType].link.text
            }
        };


        if ( options.overlayType === 'attention' ) {

            template = this.templates.overlay.attention;
            content = {
                className: config.classes.overlay.attention,
                message: text.attention.message
            };
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
    setHeaderDayText: function(date, options){

        //console.log('SET HEADER DAY TEXT', arguments, this.app.header.els.days.items);

        var text = {
                office: 'в офисе',
                restaurant: 'в Луч',
                none: 'худею'
            },
            element,
            price;

        this.app.header.els.days.items.each(function(i, e){
            var day = $(e);
            if ( day.data('date') === date ) element = day;
        });

        element
            .removeClass(config.classes.header.dayCompleted)
            .removeClass(config.classes.header.dayHasPrice)
            .find(this.app.header.els.days.comments)
            .html('');

        if ( options.type === 'office' ) {
            price = this.getDayOrderPrice(date);
            text.office += ' / ' + price + 'р.';
            element.addClass(config.classes.header.dayHasPrice);
            element
                .find(config.selectors.header.dayPriceBig)
                .html(price);
        }

        if ( options.type !== 'office' || ( options.type === 'office' && price ) ) {
            element
                .addClass(config.classes.header.dayCompleted)
                .find(this.app.header.els.days.comments)
                .html(text[options.type]);
        }
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
            localOrder = this.app.getLocalData('order'),
            menu = this.app && this.app.menu
                ? this.app.menu.model
                : null,
            setData = function(){

                console.log('--- SET DATA', order, menu);

                if ( !menu || !order ) return;

                console.warn('order view:', localOrder && !_.isEmpty(localOrder) ? 'local' : 'server', localOrder, order);

                this.order = this.assembleOrder( localOrder && !_.isEmpty(localOrder) ? localOrder : order, menu.get('objects'));

                if ( this.app && !this.app.menu ) {
                    this.app.menu = {
                        model: menu
                    };
                }


//                callback.call(this);    // TODO: remove
//                return;                 // TODO: remove

                if ( !localOrder || _.isEmpty(localOrder) ) {

                    _.each(order, function(data, date){

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

                    console.log('--- NEW LOCAL ORDER: OrderView', _.clone(localOrder));
                    this.app.setLocalData('order', localOrder);

                }

                callback.call(this);

            };

//        if ( !order || !order.length ) {
//            this.app.fetchModel(this.model, function(model){
//                order = model.get('objects');
//                setData.call(this);
//            }, this);
//        }



        this.app.fetchModel(this.model, function(model){
            order = model.get('objects')[0];
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

                if ( order && !order.restaurant && !order.none ) {

                    if ( order.weekday ) {

                        // model from server

                        _.each(order.dishes, function(categories, provider){
                            _.each(categories, function(dishes, category){
                                _.each(dishes, function(dish){

                                    days[data.date].dishes.push({
                                        name: dish.name,
                                        count: dish.count,
                                        price: dish.price,
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
                                            count: dish.count,
                                            price: dish.price,
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

            var str = {
                a: a.date.split('-'),
                b: b.date.split('-')
            },
            date = {
                a: new Date(+str.a[0], +str.a[1] - 1, +str.a[2]),
                b: new Date(+str.b[0], +str.b[1] - 1, +str.b[2])
            };

            return +date.a < +date.b ? -1 : 1;

        });

        return sorted;

    },
    render: function(){


        console.log('ORDER view render', this.order);

        if ( !this.order || !this.order.length ) return;

        var orderHTML = [];

        _.each(this.order, function(data){

            var dayHTML = [],
                dayPrice = 0,
                hasDishes = !data.restaurant && !data.none,
                template,
                content;

            _.each(data.dishes, function(dish){
                dayHTML.push(this.templates.item(dish));
                dayPrice += +dish.price;
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


        this.app.resetPage();
        this.app.makeOrder();
        this.app.setLocalData('order', null);

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

        /**********/

        $('.content__favourites-category').eq(0).addClass('m-small');
        $('.content__favourites-category').eq(4).addClass('m-small');

        // TODO: make slider

        /***********/

        var changed = false,
            timer;

        this.els.item = $(config.selectors.favourites.item);
        this.els.item.click($.proxy(function(event){

            var element = $(event.currentTarget),
                id = element.data('id'),
                selected = element.hasClass(config.classes.favourites.selected);

            selected
                ? element.removeClass(config.classes.favourites.selected)
                : element.addClass(config.classes.favourites.selected);

            changed = true;

        }, this));

        timer = setInterval($.proxy(function(){
            if ( changed ) {
                changed = false;
                this.saveFavourites();
            }
        }, this), 1000);

        $(window).one('hashchange beforeunload', $.proxy(function(){
            clearInterval(timer);
            changed && this.saveFavourites();
        }, this));

    },
    saveFavourites: function(){

        var favourites = [],
            success = function(data){
                console.log('favourites OK', data);
            },
            error = function(data){
                console.log('favourites FAIL', data);
            };

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
