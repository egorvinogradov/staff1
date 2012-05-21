String.prototype.capitalize = function(){
    return this[0].toUpperCase() + this.substr(1);
};


var MenuModel = Backbone.Model.extend({
	url: '/api/v1/day',
	initialize: function () {
        console.log('app model init:', this, this.get('options'));
    }
});

var OrderModel = Backbone.Model.extend({
	url: '/api/v1/order',
	initialize: function () {
        console.log('order model init:', this, this.get('options'));
    }
});

var FavouritesModel = Backbone.Model.extend({
	url: '/api/v1/favorite',
	initialize: function () {
        console.log('favourites model init:', this, this.get('options'));
    }
});



var AppView = Backbone.View.extend({

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

        this.els.page = $(config.selectors.page);
        this.els.wrapper = $(config.selectors.wrapper);
        this.els.wrapper.html(this.templates.page());

        this.els.header.container = $(config.selectors.header.container);
        this.els.content.container = $(config.selectors.content.container);
        this.els.content.wrapper = $(config.selectors.content.wrapper);

        this.model.fetch({
            success: $.proxy(this.modelFetchSuccess, this),
            error: $.proxy(this.modelFetchError, this)
        });

        this.model.bind('change:page', this.renderContent, this);
        this.model.bind('change:options', this.renderContent, this);
        this.model.bind('toggle', this.renderContent, this);

        //console.log('app view init:', this.page, this.model, this.model.get('objects'));

    },
    modelFetchSuccess: function(){

        console.log('model fetch success:', this.model, this.objects);

        this.objects = this.model.get('objects');
        this.menu    = this.getMenu();
        this.render();
    },
    modelFetchError: function(){

        // show error
        console.log('model fetch error:', this.model.get('objects'));
    },

    render: function(){

        console.log('app view render:', this.menu, this.model, arguments);

        if ( !this.menu ) return;

        this.header = new HeaderView();


        console.log('RENDER CONTENT:', this.model, this.page, this.menu);

        if ( !this.menu ) return;

        this.page    = this.model.get('page') || { menu: true };
        console.log('--- this page is', this.page);


        this.page.menu            && this.renderMenu();
        this.page.order           && this.renderOrder();
        this.page.favourites      && this.renderFavourites();


    },
    resetPage: function(){

        _.each(config.classes.page, function(className){
            this.els.page.removeClass(className);
        }, this);

        _.each(config.classes.content, function(className){
            this.els.content.wrapper.removeClass(className);
        }, this);

    },
    renderMenu: function(){
        this.menu = new MenuView({
            model: new MenuModel()
        });
    },
    renderOrder: function(){
        this.order = new OrderView({
            model: new OrderModel()
        });
    },
    renderFavourites: function(){
        this.favourites = new FavouritesView({
            model: new FavouritesModel()
        });
    }
});








var config = {

    selectors: {
        page:       '.page',
        wrapper:    '.page__wrapper',
        header: {
            container:      '.header',
            day:            '.header__day',
            dayTitle:       '.header__day-title',
            dayActions:     '.header__day-variants',
            dayActionsItem: '.header__day-select-item',
            dayRestaurant:  '.header__day-restaurant',
            daySlimming:    '.header__day-none',
            dayComment:     '.header__day-comment',
            providers:      '.header__providers',
            providerList:   '.header__providers-list',
            provider:       '.header__provider',
            providerName:   '.header__provider-c',
            completeButton: '.header__complete-button'
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
            dayOpened:          'm-opened',
            dayActive:          'm-active',
            dayHasPrice:        'm-has-price',
            dayCompleted:       'm-completed',
            dayInactive:        'm-inactive',
            providerActive:     'm-active',
            providersInactive:  'm-inactive'
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
    text: {
        daysRu2En: {
            'понедельник': 'monday',
            'вторник': 'tuesday',
            'среда': 'wednesday',
            'четверг': 'thursday',
            'пятница': 'friday',
            'суббота': 'saturday',
            'воскресенье': 'sunday'
        },
        daysEn2Ru: {
            monday:     'понедельник',
            tuesday:    'вторник',
            wednesday:  'среда',
            thursday:   'четверг',
            friday:     'пятница',
            saturday:   'суббота',
            sunday:     'воскресенье'
        },
        daysEn2RuInflect1: {
            monday:     'по понедельникам',
            tuesday:    'по вторникам',
            wednesday:  'по средам',
            thursday:   'по четвергам',
            friday:     'по пятницам',
            saturday:   'по субботам',
            sunday:     'по воскресеньям',
            week:       'всю неделю'
        },
        daysEn2RuInflect2: {
            monday:     'с понедельника',
            tuesday:    'со вторника',
            wednesday:  'со среды',
            thursday:   'с четверга',
            friday:     'с пятницы',
            saturday:   'с субботы',
            sunday:     'с воскресенья'
        },
//        categories: {
//            'первые блюда': 'primary',
//            'вторые блюда': 'secondary',
//            'горячие блюда': 'secondary',
//            'салаты': 'snack',
//            'холодные блюда и закуски': 'snack',
//            'бутерброды, выпечка': 'dessert',
//            'пирожное': 'dessert',
//            'прочее': 'misc'
//        },
//        standardizedCategories: {
//            primary:    'Первые блюда',
//            secondary:  'Горячие блюда',
//            snack:      'Холодные блюда и закуски',
//            dessert:    'Бутерброды и выпечка',
//            misc:       'Прочее'
//        }
        categoriesRu2En: {
            'первые блюда': 'primary',
            'вторые блюда': 'secondary',
            'горячие блюда': 'secondary',
            'салаты': 'snack',
            'холодные блюда и закуски': 'snack',
            'бутерброды, выпечка': 'dessert',
            'пирожное': 'dessert',
            'прочее': 'misc'
        },
        categoriesEn2Ru: {
            primary:    'Первые блюда',
            secondary:  'Горячие блюда',
            snack:      'Холодные блюда и закуски',
            dessert:    'Бутерброды и выпечка',
            misc:       'Прочее'
        }
    }
};







var HeaderView = Backbone.View.extend({
    els: {},
    templates: {

    },
    initialize: function(){

    },
    render: function(){

        this.els.header.container.html(this.templates.header());
        this.els.header.providers = $(config.selectors.header.providers);
        this.els.header.providerList = $(config.selectors.header.providerList);
        this.els.header.day = $(config.selectors.header.day);
        this.els.header.dayTitle = $(config.selectors.header.dayTitle);
        this.els.header.dayActionsItem = $(config.selectors.header.dayActionsItem);
        this.els.header.completeButton = $(config.selectors.header.completeButton);


        this.els.header.day
            .addClass(config.classes.header.dayInactive);


        _.each(this.menu, function(data, day){
            this.els.header.day
                .filter('[rel=' + day + ']')
                .data({ date: data.date })
                .removeClass(config.classes.header.dayInactive);
        }, this);


        this.els.header.day
            .not('.'+ config.classes.header.dayInactive)
            .find(this.els.header.dayTitle)
            .click($.proxy(function(event){
                this.hideDayActions();
                this.showDayActions(event);
            }, this));


        this.els.page.bind('click keydown', $.proxy(function(event){
            var target =    $(event.target),
                condition = ( event.type === 'click' && !target.parents().is(config.selectors.header.day) ) ||
                            ( event.type === 'keydown' && event.which === 27 );
            condition && this.hideDayActions(event);
        }, this));


        this.els.header.completeButton.click($.proxy(function(){

            if ( _.isEmpty(this.order) ) return;

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
                data: JSON.stringify(this.order), // TODO: make crossbrowser
                success: function(data){
                    data.status === 'ok'
                        ? success(data)
                        : error(data);
                },
                error: error
            });

        }, this));


        this.els.header.dayActionsItem.click($.proxy(this.hideDayActions, this));

        //console.log('render header:', this.els.header.container, this.model.get('objects'));

    },
    showDayActions: function(event){
        $(event.target)
            .parents(config.selectors.header.day)
            .addClass(config.classes.header.dayOpened);
    },
    hideDayActions: function(){
        this.els.header.day
            .removeClass(config.classes.header.dayOpened);
    },






});






var MenuView = Backbone.View.extend({
    els: {},
    templates: {

    },
    initialize: function(){
        this.model.fetch({
            success: $.proxy(this.modelFetchSuccess, this),
            error: $.proxy(this.modelFetchError, this)
        });
    },
    modelFetchSuccess: function(model, data){
        console.log('MENU model fetch success');

        this.menu = this.assembleMenu(this.model.get('objects'));
        this.render();
    },
    modelFetchError: function(){
        console.log('MENU model fetch error');
    },
    assembleMenu: function(objects){

        var mock1 = {
            'бутерброды, выпечка': [{
                id: 3466897,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 87864,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }],
            'горячие блюда': [{
                id: 35778,
                name: "1111111",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 123546,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }]
        }; // TODO: remove
        var mock2 = {
            'бутерброды, выпечка': [{
                id: 679685,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 678645,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }],
            'горячие блюда': [{
                id: 24366,
                name: "2222222",
                price: "40.00",
                weight: "35/30"
            },
            {
                id: 769673,
                name: "Бутерброд с ветчиной",
                price: "40.00",
                weight: "35/30"
            }]
        }; // TODO: remove
//        objects[3].providers['Хлеб-соль'] = mock1;  // TODO: remove
//        objects[4].providers['Хлеб-соль'] = mock2;  // TODO: remove


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

        if ( !this.menu || _.isEmpty(this.menu) ) return;



        //console.count('render menu TOP:', this.model.get('options').day, this.model.get('options').provider);

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
            isDayCorrect = options.day && options.day === corrected.day,
            isProviderCorrect = options.provider && options.provider === corrected.provider;


        console.log('--- OLOL CHECK OPTIONS', _.clone(this.model.get('options')), options.day, options.provider, '|', corrected.day, corrected.provider, '|', previousDay, previousProvider);


        if ( !isDayCorrect ) {
            options.day = corrected.day;
        }

        if ( !isProviderCorrect ) {
            options.provider = corrected.provider
        }

        if ( !isDayCorrect || !isProviderCorrect || !currentOptions.day || !currentOptions.provider && !currentOptions.overlayType ) {

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


//        if ( options.day !== previousDay ) {
//
//        }

        this.els.header.providers.removeClass(config.classes.header.providersInactive);
        this.els.header.providerList.empty();

        _.each(this.menu[day].providers, $.proxy(function(dishes, provider){
            this.els.header.providerList.append(this.templates.headerProvider({
                name: provider,
                day: options.day
            }));
        }, this));

        this.els.header.day
            .removeClass(config.classes.header.dayActive)
            .filter('[rel=' + options.day + ']')
            .addClass(config.classes.header.dayActive);

        this.els.content.wrapper.data({ 'menu-day': options.day });
        this.els.content.wrapper.data({ 'menu-date': date });



//        if ( options.provider !== previousProvider ) {
//
//        }


        this.els.content.wrapper.data({ 'menu-provider': options.provider });


        this.els.header.provider = $(config.selectors.header.provider);
        this.els.header.providerName = $(config.selectors.header.providerName);


        this.els.header.provider
            .removeClass(config.classes.header.providerActive)
            .filter('[rel=' + options.provider + ']')
            .addClass(config.classes.header.providerActive);


        this.templates.menu.group = _.template($('#template_menu-group').html());
        this.templates.menu.item = _.template($('#template_menu-item').html());


        _.each(menu, function(items){

            var groupHTML = [];

            _.each(items.dishes, function(dish){

                if ( !_.isEmpty(this.order) && this.order[date] && this.order[date].dishes[dish.id] ) {
                    dish.isSelected = this.order[date].dishes[dish.id];
                    dish.count = this.order[date].dishes[dish.id];
                }

                groupHTML.push(this.templates.menu.item(dish));
            }, this);

            menuHTML.push(this.templates.menu.group({
                name:   items.name,
                order:  items.order,
                items:  groupHTML.join('')
            }));

        }, this);


        // render menu

        this.resetPage();

        this.els.content.wrapper
            .empty()
            .append(menuHTML.join(''))
            .hide()
            .fadeIn();



        // render overlay

        if ( currentOptions.overlayType ) {

            console.log('111 currentOptions.overlayType ', currentOptions.overlayType, this.els.header.providers, '------', this.els.header.provider);

            this.els.header.providers.addClass(config.classes.header.providersInactive);
            this.els.header.provider.removeAttr('href');

            this.renderOverlay({
                day: day,
                date: date,
                type: currentOptions.overlayType
            });

            if ( !this.order[options.date] ) {
                this.order[options.date] = {
                    dishes: {},
                    restaurant: false,
                    none: true
                };
            }

            this.order[options.date].restaurant = false;
            this.order[options.date].none = false;
            this.order[options.date].dishes = {};
            this.order[options.date][currentOptions.overlayType] = true;
        }


        // bind events

        setTimeout(function(){
            context.bindEventsForOrder.call(context, date);
        }, 0);


        console.count('render menu:', this.model.get('options').day, this.model.get('options').provider, menu, day, provider);


    },
    bindEventsForOrder: function(date){






//        this.els.header.dayRestaurant = $(config.selectors.header.dayRestaurant);
//        this.els.header.daySlimming = $(config.selectors.header.daySlimming);
//        this.els.header.dayControls = this.els.header.dayRestaurant.add(this.els.header.daySlimming);

        this.els.menu.name = $(config.selectors.menu.item.name);
        this.els.menu.plus = $(config.selectors.menu.item.plus);
        this.els.menu.minus = $(config.selectors.menu.item.minus);
        this.els.menu.countControls = this.els.menu.plus.add(this.els.menu.minus);


        console.log('bind events for order:', { elements: this.els.menu.name });


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


        this.els.menu.name.click($.proxy(function(event){

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


        this.els.menu.countControls.click($.proxy(function(event){

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

        _.each(config.classes.page, function(className){
            this.els.page.removeClass(className);
        }, this);

        _.each(config.classes.content, function(className){
            this.els.content.removeClass(className);
        }, this);

        this.els.content
            .empty()
            .addClass(config.classes.content.favourites)
            .append(this.templates.container({ categories: favouritesHTML.join('') }))
            .hide()
            .fadeIn();

        this.els.page.addClass(config.classes.page.favourites);
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
                menu: true
            },
            options: {
                overlayType: 'restaurant',
                day: day
            }
        });

    },
    overlayNone: function(day){

        console.log('router overlay none:', day);

        this.refreshModel({
            page: {
                menu: true
            },
            options: {
                overlayType: 'none',
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

//        if ( !condition ) {
//            app.model.trigger('toggle');
//            console.log('TOGGLE');
//        }

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

    window.favouritesModel = new FavouritesModel();
    window.orderModel = new OrderModel();
    window.router = new Router();

    Backbone.history.start();

});
