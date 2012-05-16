var AppModel = Backbone.Model.extend({
	url: '/api/day',
	initialize: function () {
        console.log('app model init:', this, this.get('options'));
	}
});


//var OrderModel = Backbone.Model.extend({
//	url: '/api/day',
//	initialize: function () {
//        console.log('app model init:', this, this.get('options'));
//	}
//});



var AppView = Backbone.View.extend({

    selectors: {
        page:       '.page',
        wrapper:    '.page__wrapper',
        header: {
            container:      '.header',
            day:            '.header__day',
            dayTitle:       '.header__day-title',
            dayActions:     '.header__day-variants',
            dayActionsItem: '.header__day-select-item',
            dayComment:     '.header__day-comment',
            providers:      '.header__providers-list',
            provider:       '.header__provider',
            providerName:   '.header__provider-c'
        },
        content: {
            container:      '.content',
            wrapper:        '.content__wrapper'
        },
        menu: {
            groupList:      '.content__menu-list',
            groupHeader:    '.content__menu-header',
            item: {
                container:  '.content__menu-item',
                name:       '.content__menu-name',
                count:      '.content__menu-count',
                number:     '.content__menu-number',
                plus:       '.content__menu-plus',
                minus:      '.content__menu-minus'
            }
        },
        overlay:            '.content__overlay'
    },
    classes: {
        page: {
            order:          'm-order',
            favourites:     'm-favourites'
        },
        header: {
            dayOpened:      'm-opened',
            dayActive:      'm-active',
            dayHasPrice:    'm-has-price',
            dayCompleted:   'm-completed',
            dayInactive:    'm-inactive',
            providerActive: 'm-active'
        },
        content: {
            order:          'content__order',
            favourites:     'content__favourites'
        },
        menu: {
            selected:       'm-selected',
            countOne:       'm-one'
        },
        overlay: {
            start:          'm-overlay-start',
            slimming: {
                day:        'm-overlay-day-slimming',
                week:       'm-overlay-week-slimming'
            },
            restaurant: {
                day:        'm-overlay-day-restaurant',
                week:       'm-overlay-week-restaurant'
            },
            attention:      'm-overlay-attention'
        },
        favourites: {
            slider:         'm-column-slider'
        },
        order: {
            restaurant:     'content__order-restaurant',
            slimming:       'content__order-slimming'
        }
    },
    els: {
        page: null,
        wrapper: null,
        header: {},
        content: {},
        menu: {}
    },
    templates: {
        page: _.template($('#template_page').html()),
        header: _.template($('#template_header').html()),
        headerProvider: _.template($('#template_header-provider').html()),
        menu: {},
        order: {},
        favourites: {}
    },
    objects: null,
    menu: null,
    order: {},
    defaults: {
        day: 'monday',
        provider: 'fusion'
    },

    initialize: function(){

        this.els.page = $(this.selectors.page);
        this.els.wrapper = $(this.selectors.wrapper);
        this.els.wrapper.html(this.templates.page());

        this.els.header.container = $(this.selectors.header.container);
        this.els.content.container = $(this.selectors.content.container);
        this.els.content.wrapper = $(this.selectors.content.wrapper);

        this.model.fetch({
            success: $.proxy(this.modelFetchSuccess, this),
            error: $.proxy(this.modelFetchError, this)
        });

        this.model.bind('change:page', this.renderContent, this);
        this.model.bind('change:options', this.renderContent, this);
        this.model.bind('toggle', this.renderContent, this);

        //console.log('app view init:', this.page, this.model, this.model.get('objects'));

    },
    lolo: function(){
        alert('MODEL CHANGE')
    },
    modelFetchSuccess: function(){

        console.log('model fetch success:', this.model, this.objects);

        this.objects = this.model.get('objects');
        this.menu    = this.getMenu();
        this.render();

        //this.objects[0].weekday = 'Воскресенье'
        //delete this.objects[1].providers.fusion;
        //console.log('--- delete', this.objects[1]);


    },
    modelFetchError: function(){

        // show error
        console.log('model fetch error:', this.model.get('objects'));
    },
    getMenu: function(){


        var mock1 = {
            'бутерброды, выпечка': [{
                id: 233,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 233,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }],
            'горячие блюда': [{
                id: 233,
                name: "1111111",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 233,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }]
        };
        var mock2 = {
            'бутерброды, выпечка': [{
                id: 233,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 233,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }],
            'горячие блюда': [{
                id: 233,
                name: "2222222",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 233,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }]
        };
        this.objects[0].providers['Хлеб-соль'] = mock1;
        this.objects[1].providers['Хлеб-соль'] = mock2;



        var config = {

            days: {
                'понедельник': 'monday',
                'вторник': 'tuesday',
                'среда': 'wednesday',
                'четверг': 'thursday',
                'пятница': 'friday',
                'суббота': 'saturday',
                'воскресенье': 'sunday'
            },
            categories: {
                'первые блюда': 'primary',
                'вторые блюда': 'secondary',
                'горячие блюда': 'secondary',
                'салаты': 'snack',
                'холодные блюда и закуски': 'snack',
                'бутерброды, выпечка': 'dessert',
                'пирожное': 'dessert',
                'прочее': 'misc'
            },
            standardizedCategories: {
                primary: 'Первые блюда',
                secondary: 'Горячие блюда',
                snack: 'Холодные блюда и закуски',
                dessert: 'Бутерброды и выпечка',
                misc: 'Прочее'
            },
            categoriesOrder: {
                primary: 0,
                secondary: 1,
                snack: 2,
                dessert: 3,
                misc: 4
            }
        },
        trim = function(str){

            return str
                    .toLowerCase()
                    .replace(/^\s+/, '')
                    .replace(/\s+$/, '')
                    .replace(/\s+/g, ' ');
        },
        weekMenu = {};

        _.each(this.objects, function(day){

            var weekday = config.days[ trim(day.weekday) ],
                dayMenu = weekMenu[ weekday ] = {
                    providers: {},
                    date: day.date
                };

            _.each(day.providers, function(categories, provider){

                var providerMenu = dayMenu.providers[provider] = {};

                _.each(categories, function(dishes, category){

                    var categoryName = config.categories[ trim(category) ],
                        categoryMenu = providerMenu[categoryName] = {
                            name:   config.standardizedCategories[categoryName],
                            order:  config.categoriesOrder[categoryName],
                            dishes: dishes
                        };

                });
            });
        });


        console.log('set menu:', weekMenu);

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
            //p = this.,
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
    render: function(){

        console.log('app view render:', this.menu, this.model, arguments);

        if ( !this.menu ) return;

        this.renderHeader();
        this.renderContent();

    },
    renderContent: function(){

        console.log('RENDER CONTENT:', this.model, this.page, this.menu);

        if ( !this.menu ) return;

        this.page    = this.model.get('page') || { menu: true };
        console.log('--- this page is', this.page);


        this.page.menu            && this.renderMenu();
        this.page.overlay         && this.renderOverlay();
        this.page.order           && this.renderOrder();
        this.page.favourites      && this.renderFavourites();

    },
    renderHeader: function(){

        this.els.header.container.html(this.templates.header());
        this.els.header.providers = $(this.selectors.header.providers);
        this.els.header.day = $(this.selectors.header.day);
        this.els.header.dayTitle = $(this.selectors.header.dayTitle);
        this.els.header.dayActionsItem = $(this.selectors.header.dayActionsItem);


        this.els.header.day
            .addClass(this.classes.header.dayInactive);


        _.each(this.menu, function(data, day){
            this.els.header.day
                .filter('[rel=' + day + ']')
                .removeClass(this.classes.header.dayInactive);
        }, this);


        this.els.header.day
            .not('.'+ this.classes.header.dayInactive)
            .find(this.els.header.dayTitle)
            .click($.proxy(function(event){
                this.hideDayActions();
                this.showDayActions(event);
            }, this));


        this.els.page.bind('click keydown', $.proxy(function(event){
            var target =    $(event.target),
                condition = ( event.type === 'click' && !target.parents().is(this.selectors.header.day) ) ||
                            ( event.type === 'keydown' && event.which === 27 );
            condition && this.hideDayActions(event);
        }, this));


        this.els.header.dayActionsItem.click($.proxy(this.selectDayAction, this));

        console.log('render header:', this.els.header.container, this.model.get('objects'));

    },
    showDayActions: function(event){
        $(event.target)
            .parents(this.selectors.header.day)
            .addClass(this.classes.header.dayOpened);
    },
    hideDayActions: function(){
        this.els.header.day
            .removeClass(this.classes.header.dayOpened);
    },
    selectDayAction: function(event){

        var target = $(event.target);
        target
            .parents(this.selectors.header.day)
            .find(this.els.header.dayComment)
            .html( target.html() );

        this.hideDayActions();
    },
    resetPage: function(){

        _.each(this.classes.page, function(className){
            this.els.page.removeClass(className);
        }, this);

        _.each(this.classes.content, function(className){
            this.els.content.wrapper.removeClass(className);
        }, this);

    },
    renderMenu: function(){

        var previousProvider = this.els.content.wrapper.data('menu-provider'),
            previousDay = this.els.content.wrapper.data('menu-day'),
            currentOptions = this.model.get('options') || {},
            options = {
                day: currentOptions.day || previousDay,
                provider: currentOptions.provider || previousProvider
            },
            corrected = this.correctOptions(options),
            menuHTML = [],
            menu = [],
            day,
            date,
            provider,
            context = this,
            bindEventsForOrder = function(){
                context.bindEventsForOrder.call(context, date)
            },
            isDayCorrect = options.day && options.day === corrected.day,
            isProviderCorrect = options.provider && options.provider === corrected.provider;


        if ( !isDayCorrect ) {
            options.day = corrected.day;
        }

        if ( !isProviderCorrect ) {
            options.provider = corrected.provider
        }


        console.log('render menu TOP:', corrected, options, this.menu, '|', previousDay, previousProvider, '|', isDayCorrect, isProviderCorrect);

        
        if ( !isDayCorrect || !isProviderCorrect || !currentOptions.day || !currentOptions.provider ) {

            console.log('options INCORRECT:', options.day, options.provider, '\n\n');
            document.location.hash = '#/menu/' + options.day + '/' + options.provider + '/';
            return;
        }
        else {
            console.log('options CORRECT:', options.day, options.provider, '\n\n');
        }

        day = options.day;
        provider = options.provider;
        date = this.menu[day].date;


        _.each(this.menu[day].providers[provider], function(item){
            menu.push(item);
        });

        
        menu.sort(function(a,b){
            return a.order < b.order ? -1 : 1;
        });


        if ( options.day !== previousDay ) {

            this.els.header.providers.empty();

            _.each(this.menu[day].providers, $.proxy(function(dishes, provider){
                this.els.header.providers.append(this.templates.headerProvider({
                    name: provider,
                    day: options.day
                }));
            }, this));

            this.els.header.day
                .removeClass(this.classes.header.dayActive)
                .filter('[rel=' + options.day + ']')
                .addClass(this.classes.header.dayActive);

            this.els.content.wrapper.data({ 'menu-day': options.day });
            this.els.content.wrapper.data({ 'menu-date': date });
        }


        if ( options.provider !== previousProvider ) {
            this.els.content.wrapper.data({ 'menu-provider': options.provider });
        }


        this.els.header.provider = $(this.selectors.header.provider);
        this.els.header.providerName = $(this.selectors.header.providerName);


        this.els.header.provider
            .removeClass(this.classes.header.providerActive)
            .filter('[rel=' + options.provider + ']')
            .addClass(this.classes.header.providerActive);


        this.templates.menu.group = _.template($('#template_menu-group').html());
        this.templates.menu.item = _.template($('#template_menu-item').html());


        _.each(menu, function(items){

            var groupHTML = [];

            _.each(items.dishes, function(dish){
                groupHTML.push(this.templates.menu.item(dish));
            }, this);

            menuHTML.push(this.templates.menu.group({
                name:   items.name,
                order:  items.order,
                items:  groupHTML.join('')
            }));

        }, this);

        this.resetPage();

        this.els.content.wrapper
            .empty()
            .append(menuHTML.join(''))
            .hide()
            .fadeIn();


        
        setTimeout(bindEventsForOrder, 0); // make order

        console.log('render menu:', menu, day, provider);

    },
    bindEventsForOrder: function(date){

//        data = {
//            '30-09-1989': {
//                'dishes' : {
//                    1124342: 1,
//                    342423423: 2
//                },
//
//                restaurant: null
//            }
//        }


        this.els.menu.name = $(this.selectors.menu.item.name);
        this.els.menu.plus = $(this.selectors.menu.item.plus);
        this.els.menu.minus = $(this.selectors.menu.item.minus);
        this.els.menu.countControls = this.els.menu.plus.add(this.els.menu.minus);

        this.els.menu.name.click($.proxy(function(event){

            var els = {},
                id;

            els.dish = $(event.currentTarget);
            els.container = els.dish.parents(this.selectors.menu.item.container);
            id = els.container.data('id');

            els.container.addClass(this.classes.menu.selected);

            if ( !this.order[date] ) {
                this.order[date] = {
                    dishes: {},
                    restaurant: null
                };
            }

            this.order[date].dishes[id] = 1;

        }, this));


        this.els.menu.countControls.click($.proxy(function(event){

            var els = {},
                count = {},
                id;

            els.button = $(event.currentTarget);
            els.container = els.button.parents(this.selectors.menu.item.container);
            els.count = els.container.find(this.selectors.menu.item.count);
            els.number = els.count.find(this.selectors.menu.item.number);
            id = els.container.data('id');

            count.original = +els.number.html() || 1;
            count.increment = count.original + 1;
            count.decrement = count.original > 1 ? count.original - 1 : 1;
            count.changed = els.button.is(this.selectors.menu.item.plus)
                ? count.increment
                : count.decrement;

            if ( !this.order[date] ) {
                this.order[date] = {
                    dishes: {},
                    restaurant: null
                };
            }

            this.order[date].dishes[id] = count.changed;

            count.changed > 1
                ? els.count.removeClass(this.classes.menu.countOne)
                : els.count.addClass(this.classes.menu.countOne);

            els.number.html(count.changed);

        }, this));

    },
    renderOverlay: function(){

        var options = this.model.get('options'),
            content,
            template,
            config = {
                days: {
                    monday:     'по понедельникам',
                    tuesday:    'по вторникам',
                    wednesday:  'по средам',
                    thursday:   'по четвергам',
                    friday:     'по пятницам',
                    saturday:   'по субботам',
                    sunday:     'по воскресеньям',
                    week:       'всю неделю'
                },
                start: {
                    message:        'Начните ',
                    days: {
                        monday:     'с понедельника',
                        tuesday:    'со вторника',
                        wednesday:  'со среды',
                        thursday:   'с четверга',
                        friday:     'с пятницы',
                        saturday:   'с субботы',
                        sunday:     'с воскресенья'
                    }
                },
                slimming: {
                    message:    'Худею ',
                    link: {
                        href:   'http://ru.wikipedia.org/',
                        text:   'Худейте правильно!'
                    }
                },
                restaurant: {
                    message:    'Луч гламура ',
                    link: {
                        href:   'http://maps.yandex.ru/',
                        text:   'Где это клёвое место?'
                    }
                }
            };


        config.slimming.days = config.days;
        config.restaurant.days = config.days;

        console.log('render overlay:', options);

        if ( !options.type && ( ( options.type === 'restaurant' || options.type === 'none' ) && !options.day ) ) {
            return;
        }


        this.templates.overlayCommon = _.template($('#template_overlay').html());
        this.templates.overlayAttention = _.template($('#template_overlay').html());


        content = {
            className: this.classes.overlay[options.type][ options.day === 'week' ? 'week' : 'day' ],
            message: config[options.type].message + config.days[options.day],
            link: {
                href: config[options.type].link.href,
                text: config[options.type].link.text
            }
        };


        template = options.type === 'attention'
            ? this.templates.overlayAttention
            : this.templates.overlayCommon;

        this.els.content.wrapper
            .find(this.selectors.overlay)
            .remove()
            .end()
            .append(template(content))

    },
    renderOrder: function(){

        var example = { // TODO: save in local storage
            monday: {
                order: [],
                luch: true,
                nothing: false
            },
            tuesday: {
                order: [],
                luch: false,
                nothing: true
            },
            wednesday: {
                order: [
                    {
                        id: 20115,
                        name: "Бутерброд с ветчиной",
                        price: 40,
                        weight: "35/30"
                    },
                    {
                        id: 20116,
                        name: "Бутерброд с сыром",
                        price: 40,
                        weight: "35/30"
                    },
                    {
                        id: 20117,
                        name: "Бутерброд с семгой ",
                        price: 90,
                        weight: "30/5/5/30"
                    }
                ],
                luch: false,
                nothing: false
            },
            thursday: {
                order: [
                    {
                        id: 20118,
                        name: "Пирожок с вишней",
                        price: 25,
                        weight: "60.0"
                    },
                    {
                        id: 20119,
                        name: "Пирожок с яблоком",
                        price: 25,
                        weight: "60.0"
                    },
                    {
                        id: 20120,
                        name: "Пирожок с капустой",
                        price: 25,
                        weight: "60.0"
                    }
                ],
                luch: false,
                nothing: false
            },
            friday: {
                order: [
                    {
                        id: 20121,
                        name: "Пирожок с мясом",
                        price: 25,
                        weight: "60.0"
                    },
                    {
                        id: 20122,
                        name: "Ватрушка с творогом",
                        price: 25,
                        weight: "60.0"
                    },
                    {
                        id: 20123,
                        name: "Круассан с фрук. конфетюром",
                        price: 25,
                        weight: "75.0"
                    }
                ],
                luch: false,
                nothing: false
            }
        };


        var orderHTML = [],
            order = [];


        var messages = { // TODO: move to global settings

                luch: {
                    text: 'Луч гламура',
                    className: this.classes.order.restaurant
                },
                nothing: {
                    text: 'Худею',
                    className: this.classes.order.slimming
                }
            },
            decline = { // TODO: move to global settings
                monday:     'по понедельникам',
                tuesday:    'по вторникам',
                wednesday:  'по средам',
                thursday:   'по четвергам',
                friday:     'по пятницам',
                saturday:   'по субботам',
                sunday:     'по воскресеньям'
            };



        _.each(example, function(dayOrder, day){
            order.push({
                day:        day, // TODO: set russian day name
                dayIndex:   0, // TODO: set weekday index
                order:      dayOrder.order,
                luch:       dayOrder.luch,
                nothing:    dayOrder.nothing
            });
        });


        order.sort(function(a,b){
            return a.weekday > b.weekday ? -1 : 1;
        });

        this.templates.order.group          = {};
        this.templates.order.group.dishes   = _.template($('#template_order-group-dishes').html());
        this.templates.order.group.message  = _.template($('#template_order-group-message').html());
        this.templates.order.item           = this.templates.menu.item || _.template($('#template_menu-item').html());


        _.each(order, function(dayOrder, day){

            var dayOrderHTML = [],
                dayPrice = 0,
                dayMessage,
                groupTemplate = !dayOrder.order.length && ( dayOrder.luch || dayOrder.nothing )
                    ? this.templates.order.group.message
                    : this.templates.order.group.dishes;

            _.each(dayOrder.order, function(dish){

                dayPrice += dish.price;
                dayOrderHTML.push(this.templates.order.item(dish));

            }, this);


            if ( dayOrder.order.length && !dayOrder.luch && !dayOrder.nothing ) {

                orderHTML.push(this.templates.order.group.dishes({
                    day:        dayOrder.day,
                    price:      dayPrice,
                    dishes:     dayOrderHTML.join('')
                }));
            }
            else {

                dayMessage =
                    dayOrder.luch    && messages.luch ||
                    dayOrder.nothing && messages.nothing;

                orderHTML.push(this.templates.order.group.message({
                    day:        dayOrder.day,
                    dDay:       decline[dayOrder.day],
                    text:       dayMessage.text,
                    className:  dayMessage.className,
                    dishes:     dayOrderHTML.join('')
                }));
            }

        }, this);


        this.resetPage();

        this.els.content.wrapper
            .empty()
            .addClass(this.classes.content.order)
            .append(orderHTML.join(''))
            .hide()
            .fadeIn();

        this.els.page.addClass(this.classes.page.order);

        console.log('render order:', this.model.get('objects'));

    },
    renderFavourites: function(){

        var favourites = {},
            favouritesHTML = [];

        this.templates.favourites.container = _.template($('#template_favourites').html());
        this.templates.favourites.category  = _.template($('#template_favourites-category').html());
        this.templates.favourites.item      = _.template($('#template_favourites-item').html());


        _.each(this.menu, function(providers, day){

            _.each(providers, function(categories, provider){

                _.each(categories, function(menu, category){

                    if ( !favourites[category] ) favourites[category] = [];

                    _.each(menu.dishes, function(dish){

                        favourites[category].push({
                            id:         dish.id,
                            name:       dish.name,
                            provider:   provider
                        });

                    }, this);

                }, this);

            }, this);

        }, this);


        _.each(favourites, function(category, categoryName){

            var categoryHTML = [];

            category.sort(function(a, b){
                return a.name > a.name ? -1 : 1;
            });

            _.each(category, function(dish){
                categoryHTML.push(this.templates.favourites.item(dish));
            }, this);

            favouritesHTML.push(this.templates.favourites.category({
                name:       categoryName,
                category:   categoryName,
                items:      categoryHTML.join('')
            }));

        }, this);


        this.resetPage();

        this.els.content.wrapper
            .empty()
            .addClass(this.classes.content.favourites)
            .append(this.templates.favourites.container({ categories: favouritesHTML.join('') }))
            .hide()
            .fadeIn();

        this.els.page.addClass(this.classes.page.favourites);

        console.log('render favourites:', this.model.get('objects'), '|', favourites);
    }
});






















var Router = Backbone.Router.extend({

    routes: {
        '':                     'start',
        'menu/:day':            'menu',
        'menu/:day/':           'menu',
        'menu/:day/:provider':  'menu',
        'menu/:day/:provider/': 'menu',
        'luch/:day':            'overlayLuch',
        'luch/:day/':           'overlayLuch',
        'none/:day':            'overlayNone',
        'none/:day/':           'overlayNone',
        'order':                'order',
        'order/':               'order',
        'favourites':           'favourites',
        'favourites/':          'favourites'
        
    },
    start: function(){

        console.log('router start');

        this.refreshModel({
            page: {
                menu: true
            }
        });
    },
    menu: function(day, provider){

        console.log('router menu', day, provider);

        this.refreshModel({
            page: {
                menu: true
            },
            options: {
                provider: provider,
                day: day
            }
        });
    },
    overlayLuch: function(day){

        console.log('router overlay luch:', day);

        this.refreshModel({
            page: {
                overlay: true
            },
            options: {
                type: 'restaurant',
                day: day
            }
        });

    },
    overlayNone: function(day){

        console.log('router overlay none:', day);

        this.refreshModel({
            page: {
                overlay: true
            },
            options: {
                type: 'slimming',
                day: day
            }
        });

    },
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

        console.log('refresh model:', data.page, data.options, app.model, app.model.get('options'));

        var model = app.model,
            options = model.get('options'),
            page = model.get('page'),
            day = model.day,
            provider = model.provider,
            condition =
                data.page && data.page === page ||
                data.options && data.options.day === day && data.options.provider === provider;

        if ( !condition ) {
            app.model.trigger('toggle');
            console.log('TOGGLE');
        }

        app.model.set({
            page: data.page,
            options: data.options
        });

    }
});











$(function(){

    console.log('backbone init');

    window.app = new AppView({
        model: new AppModel()
    });

    window.router = new Router();

    Backbone.history.start();

});
