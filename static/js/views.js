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
    render: function(){

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
                el: this.els.contentWrapper
            });
        }

        if ( this.page.favourites ) {
            this.favourites = new FavouritesView({
                model: new FavouritesModel(),
                el: this.els.contentWrapper
            });
        }
    },
    renderMenu: function(options){
        this.menu.render(options);
    },
    resetPage: function(){

        _.each(config.classes.page, function(className){
            this.els.page.removeClass(className);
        }, this);

        _.each(config.classes.content, function(className){
            this.els.content.removeClass(className);
        }, this);

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
            actions: $(config.selectors.header.dayActionsItem)
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
            .click($.proxy(function(event){
                this.hideActions();
                this.showActions(event);
            }, this));
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
    toggleDay: function(day){

        this.els.days.items
            .removeClass(config.classes.header.dayActive)
            .filter('[rel="' + day + '"]')
            .addClass(config.classes.header.dayActive);

    },
    makeOrder: function(order){

        // TODO: save model

        this.els.complete.click($.proxy(function(){

            if ( _.isEmpty(order) ) return;

            var success = function(data){
                    console.log('order OK', data);
                },
                error = function(data){
                    console.log('order FAIL', data);
                };

            $.ajax({
                type: 'POST',
                contentType: 'application/json',
                url: '/api/v1/order/',
                data: $.stringify(order),
                success: function(data){
                    data.status === 'ok'
                        ? success(data)
                        : error(data);
                },
                error: error
            });

        }, this));
    }
});




var MenuView = Backbone.View.extend({
    els: {},
    templates: {
        group: _.template($('#template_menu-group').html()),
        item: _.template($('#template_menu-item').html())
    },
    initialize: function(data){

        console.log('MENU view init', data, this.el, data.app, data.app.els.page);

        this.model.fetch({
            success: $.proxy(this.modelFetchSuccess, this),
            error: $.proxy(this.modelFetchError, this)
        });

        this.el = $(this.el);
        this.app = data.app;
    },
    modelFetchSuccess: function(model, data){
        this.menu = this.assembleMenu(this.model.get('objects'));
        this.render();
    },
    modelFetchError: function(){
        console.log('MENU model fetch error');
    },
    assembleMenu: function(objects){

        var weekMenu = {},
            categoriesOrder = {
                primary: 0,
                secondary: 1,
                snack: 2,
                dessert: 3,
                misc: 4
            },
            trim = function(str){
                return str
                    .toLowerCase()
                    .replace(/^\s+/, '')
                    .replace(/\s+$/, '')
                    .replace(/\s+/g, ' ');
            };

        _.each(objects, function(day){

            var weekday = config.text.daysRu2En[ trim(day.weekday) ],
                dayMenu = weekMenu[ weekday ] = {
                    providers: {},
                    date: day.date
                };

            _.each(day.providers, function(categories, provider){

                var providerMenu = dayMenu.providers[provider] = {};

                _.each(categories, function(dishes, category){

                    var categoryName = config.text.categoriesRu2En[ trim(category) ],
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
                provider: options.provider || 'fusion'
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

        var menuArr = [],
            menuHTML = [];

        _.each(menu[options.day].providers[options.provider], function(item){
            menuArr.push(item);
        });

        menuArr.sort(function(a,b){
            return a.order < b.order ? -1 : 1;
        });


        console.log('-- getMenuHTML', menuArr);

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

        if ( !this.menu || _.isEmpty(this.menu) ) return;

        console.log('MENU view render:', this.menu, this.el);

        this.app.header.bindDayEvents(this.menu);

        var _this = this,
            currentOptions = params && params.options // TODO: fix
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

        if ( !isDayCorrect || !isProviderCorrect || !currentOptions.day || !currentOptions.provider && !currentOptions.overlayType ) {
            console.log('options INCORRECT:', options.day, options.provider, '\n\n');
            document.location.hash = '#/menu/' + options.day + '/' + options.provider + '/';
            return;
        }
        else {
            console.log('options CORRECT:', options.day, options.provider, '\n\n');
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
            .append(this.getMenuHTML(this.menu, this.order, options))
            .hide()
            .fadeIn();

//        if ( currentOptions.overlayType ) {
//
//            this.els.header.providers.addClass(config.classes.header.providersInactive);
//            this.els.header.provider.removeAttr('href');
//
//            this.renderOverlay({
//                day: options.day,
//                date: options.date,
//                type: currentOptions.overlayType
//            });
//
//            if ( !this.order[options.date] ) {
//                this.order[options.date] = {
//                    dishes: {},
//                    restaurant: false,
//                    none: true
//                };
//            }
//
//            this.order[options.date].restaurant = false;
//            this.order[options.date].none = false;
//            this.order[options.date].dishes = {};
//            this.order[options.date][currentOptions.overlayType] = true;
//        }


        setTimeout(function(){
            _this.bindEventsForOrder.call(_this, options.date);
        }, 0);

    },
    bindEventsForOrder: function(date){


//        this.els.header.dayRestaurant = $(config.selectors.header.dayRestaurant);
//        this.els.header.daySlimming = $(config.selectors.header.daySlimming);
//        this.els.header.dayControls = this.els.header.dayRestaurant.add(this.els.header.daySlimming);

        this.els.name = $(config.selectors.menu.item.name);
        this.els.plus = $(config.selectors.menu.item.plus);
        this.els.minus = $(config.selectors.menu.item.minus);
        this.els.countControls = this.els.plus.add(this.els.minus);


//        this.els.header.dayControls.click($.proxy(function(){
//
//            var button = $(event.currentTarget),
//                container = button.parents(config.selectors.header.day),
//                options = {
//                    day: container.attr('rel'),
//                    date: container.data('date'),
//                    type: button.data('type')
//                };
//
//            this.renderOverlay({
//                day: options.day,
//                date: options.date,
//                type: options.type
//            });
//
//            if ( !this.order[options.date] ) {
//                this.order[options.date] = {
//                    dishes: {},
//                    restaurant: false,
//                    none: true
//                };
//            }
//
//            if ( options.type === 'restaurant' ) {
//                this.order[options.date].restaurant = true;
//                this.order[options.date].none = false;
//                this.order[options.date].dishes = {};
//            }
//
//            if ( options.type === 'slimming' ) {
//                this.order[options.date].restaurant = false;
//                this.order[options.date].none = true;
//                this.order[options.date].dishes = {};
//            }
//
//        }, this));


        this.els.name.click($.proxy(function(event){

            var selected = config.classes.menu.selected,
                els = {},
                id;

            els.dish = $(event.currentTarget);
            els.container = els.dish.parents(config.selectors.menu.item.container);
            id = els.container.data('id');

            if ( !this.order[date] ) {
                this.order[date] = {
                    dishes: {},
                    restaurant: false,
                    none: false
                };
            }

            if ( els.container.hasClass(selected) ) {
                delete this.order[date].dishes[id];
                els.container.removeClass(selected);
            }
            else {
                this.order[date].dishes[id] = 1;
                els.container.addClass(selected);
            }

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
            count.increment = count.original < 10 ? count.original + 1 : 10;
            count.decrement = count.original > 1 ? count.original - 1 : 1;
            count.changed = els.button.is(config.selectors.menu.item.plus)
                ? count.increment
                : count.decrement;

            if ( !this.order[date] ) {
                this.order[date] = {
                    dishes: {},
                    restaurant: false,
                    none: false
                };
            }

            this.order[date].dishes[id] = count.changed;

            count.changed > 1
                ? els.count.removeClass(config.classes.menu.countOne)
                : els.count.addClass(config.classes.menu.countOne);

            els.number.html(count.changed);

        }, this));

    },
    renderOverlay: function(options){

        console.log('render overlay:', options);

        var content,
            template,
            config = {
                start: {
                    message: 'Начните ',
                    days: config.text.days2
                },
                slimming: {
                    message: 'Худею ',
                    link: {
                        href: 'http://ru.wikipedia.org/wiki/Диета',
                        text: 'Худейте правильно!'
                    },
                    days: config.text.days1
                },
                restaurant: {
                    message: 'Луч гламура ',
                    link: {
                        href: 'http://goo.gl/KU6eY',
                        text: 'Где это клёвое место?'
                    },
                    days: config.text.days1
                }
            };


        if ( !options.type && ( ( options.type === 'restaurant' || options.type === 'slimming' ) && !options.day ) ) {
            return;
        }


        this.templates.overlayCommon = _.template($('#template_overlay').html());
        this.templates.overlayAttention = _.template($('#template_overlay-attention').html());


        content = {
            className: config.classes.overlay[options.type][ options.day === 'week' ? 'week' : 'day' ],
            message: config[options.type].message + config[options.type].days[options.day],
            link: {
                href: config[options.type].link.href,
                text: config[options.type].link.text
            }
        };

        template = options.type === 'attention'
            ? this.templates.overlayAttention
            : this.templates.overlayCommon;


        this.els.content.wrapper
            .find(config.selectors.overlay)
            .remove()
            .end()
            .append(template(content));

    }
});








var OrderView = Backbone.View.extend({
    els: {},
    templates: {
        dishes: _.template($('#template_order-group-dishes').html()),
        message: _.template($('#template_order-group-message').html()),
        item: _.template($('#template_menu-item').html())
    },
    initialize: function(){

        console.log('ORDER view initialize', this.model, this.model.get('objects'));

        this.els.page = $(config.selectors.page);
        this.els.content = $(config.selectors.content.wrapper);

        this.model.fetch({
            success: $.proxy(this.modelFetchSuccess, this),
            error: $.proxy(this.modelFetchError, this)
        });
    },
    modelFetchSuccess: function(model, data){
        console.log('ORDER model fetch success', model, data);
        this.order = this.model.get('objects');
        this.render();
    },
    modelFetchError: function(){
        console.log('ORDER model fetch error');
    },
    render: function(){

        console.log('ORDER view render');

        if ( !this.order || _.isEmpty(this.order) ) return; // ??? this.order.length



        return;

//        data = {
//            '30-09-1989': {
//                'dishes' : {
//                    1124342: 1,
//                    342423423: 2
//                },
//
//                restaurant: null,
//                none: false
//            }
//        }




        var menu = {},
            dates = {},
            orderObj = {},
            orderArr = [],
            orderHTML = [];


        _.each(this.menu, $.proxy(function(dayMenu, day){
            menu[dayMenu.date] = {
                providers: dayMenu.providers,
                weekday: day
            };
        }, this));


        _.each(this.order, $.proxy(function(dayOrder, dateStr){

            var weekday = menu[dateStr].weekday,
                dateArr = dateStr.split('-'),
                date = new Date(+dateArr[0], +dateArr[1] - 1, +dateArr[2]),
                createItem = function(){
                    if ( !orderObj[weekday] ) {
                        orderObj[weekday] = {
                            order: +date,
                            date: dateStr,
                            weekday: weekday,
                            dishes: [],
                            restaurant: dayOrder.restaurant
                        };
                    }
                };

            if ( dayOrder.restaurant ) {
                createItem();
            }

            _.each(menu[dateStr].providers, $.proxy(function(categories, provider){

                _.each(categories, $.proxy(function(categoryData, category){

                    _.each(categoryData.dishes, $.proxy(function(dish){

                        if ( this.order[dateStr].dishes[dish.id] ) {

                            var extendedDish = {
                                id: dish.id,
                                name: dish.name,
                                price: dish.price,
                                weight: dish.weight,
                                provider: provider,
                                category: config.text.categoriesEn2Ru[category]
                            };

                            createItem();
                            orderObj[weekday].dishes.push(extendedDish);
                        }
                    }, this));
                }, this));
            }, this));
        }, this));


        this.els.header.day
            .not('.'+config.classes.header.dayInactive)
            .each(function(i, element){

                var day = $(element),
                    dateStr = day.data('date'),
                    weekday = day.attr('rel'),
                    dateArr = dateStr.split('-');

                dates[weekday] = {
                    order: +new Date(+dateArr[0], +dateArr[1] - 1, +dateArr[2]),
                    date: dateStr,
                    weekday: weekday,
                    dishes: [],
                    restaurant: null
                };
            });

        _.each(dates, $.proxy(function(dateData, weekday){
            if ( !orderObj[weekday] ) {
                orderObj[weekday] = dates[weekday];
            }
        }, this));


        _.each(orderObj, function(dayData, day){
            orderArr.push(dayData);
        });


        orderArr.sort(function(a, b){
            return a.order < b.order ? -1 : 1;
        });

        _.each(orderArr, $.proxy(function(dayOrder){

            var dayHTML = [],
                dayPrice = 0,
                template,
                content;

            _.each(dayOrder.dishes, $.proxy(function(dish){
                dayPrice += +dish.price;
                dayHTML.push(this.templates.order.item(dish));
            }, this));


            template = this.templates.order.group.dishes,
            content = {
                date: dayOrder.date,
                day: config.text.daysEn2Ru[dayOrder.weekday].capitalize(),
                price: dayPrice,
                dishes: dayHTML.join('')
            };


            if ( !dayHTML.length && !dayOrder.restaurant ) {

                template = this.templates.order.group.message;
                content = {
                    date: dayOrder.date,
                    day: config.text.daysRu2En[dayOrder.weekday].capitalize(),
                    className: config.classes.order.slimming,
                    message: 'Худею ' + config.text.daysEn2RuInflect1[dayOrder.weekday]
                };
            }

            if ( dayOrder.restaurant ) {
                template = this.templates.order.group.message;
                content = {
                    date: dayOrder.date,
                    day: config.text.daysRu2En[dayOrder.weekday].capitalize(),
                    className: config.classes.order.restaurant,
                    message: 'Луч гламура ' + config.text.daysEn2RuInflect1[dayOrder.weekday]
                };
            }

            orderHTML.push(template(content));

        }, this));


        this.resetPage();

        this.els.content.wrapper
            .empty()
            .addClass(config.classes.content.order)
            .html(orderHTML.join(''))
            .hide()
            .fadeIn();

        this.els.page.addClass(config.classes.page.order);
    }
});

















var FavouritesView = Backbone.View.extend({
    els: {},
    templates: {
        container: _.template($('#template_favourites').html()),
        category: _.template($('#template_favourites-category').html()),
        item: _.template($('#template_favourites-item').html())
    },
    initialize: function(){

        console.log('FAVOURITES view initialize', this.model, this.model.get('objects'));

        this.els.page = $(config.selectors.page);
        this.els.content = $(config.selectors.content.wrapper);

        this.model.fetch({
            success: $.proxy(this.modelFetchSuccess, this),
            error: $.proxy(this.modelFetchError, this)
        });
    },
    modelFetchSuccess: function(model, data){
        console.log('FAVOURITES model fetch success', model, data);
        this.favourites = this.model.get('objects');
        this.render();
    },
    modelFetchError: function(){
        console.log('FAVOURITES model fetch error');
    },
    render: function(){

        console.log('FAVOURITES view render', this.favourites, this.favourites ? true : false);

        if ( !this.favourites || !this.favourites.length ) return;

        var favourites = {},
            favouritesHTML = [];

        _.each(this.favourites, function(dish){
            var category = config.text.categories[dish.category];
            if ( !favourites[category] ) favourites[category] = [];
            favourites[category].push(dish);
        });

        _.each(favourites, function(dishes){
            dishes.sort(function(a, b){
                return a.provider > b.provider ? -1 : 1;
            });
        });

        _.each(favourites, $.proxy(function(dishes, category){

            var categoryHTML = [];

            _.each(category, function(dish){
                categoryHTML.push(this.templates.item(dish));
            }, this);

            favouritesHTML.push(this.templates.category({
                name:       config.text.standardizedCategories[category],
                category:   category,
                items:      categoryHTML.join('')
            }));

        }));

        this.app.resetPage();

        this.els.content
            .empty()
            .addClass(config.classes.content.favourites)
            .append(this.templates.container({ categories: favouritesHTML.join('') }))
            .hide()
            .fadeIn();

        this.els.page.addClass(config.classes.page.favourites);
    }
});
