var AppModel = Backbone.Model.extend({
    url:'/api/day',
    initialize:function () {
        console.log('app model init:', this);
    }
});


var AppView = Backbone.View.extend({

<<<<<<< HEAD
    selectors:{
        page:'.page',
        wrapper:'.page__wrapper',
        header:{
            container:'.header',
            day:'.header__day',
            dayTitle:'.header__day-title',
            dayActions:'.header__day-variants',
            dayActionsItem:'.header__day-select-item',
            dayComment:'.header__day-comment',
            provider:'.header__provider',
            providerName:'.header__provider-c'
        },
        content:{
            container:'.content',
            wrapper:'.content__wrapper'
        },
        menu:{
            groupList:'.content__menu-list',
            groupHeader:'.content__menu-header'
        }
    },
    classes:{
        page:{
            order:'m-order',
            favourites:'m-favourites'
        },
        header:{
            dayOpened:'m-opened',
            dayHasPrice:'m-has-price',
            dayCompleted:'m-completed',
            dayInactive:'m-inactive',
            providerActive:'m-active'
        },
        content:{
            order:'content__order',
            favourites:'content__favourites'
        },
        favourites:{
            slider:'m-column-slider'
        },
        order:{
            luch:'content__order-restaurant',
            slimming:'content__order-slimming'
=======
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
            groupHeader:    '.content__menu-header'
        }
    },
    classes: {
        page: {
            order:          'm-order',
            favourites:     'm-favourites'
        },
        header: {
            dayOpened:      'm-opened',
            dayHasPrice:    'm-has-price',
            dayCompleted:   'm-completed',
            dayInactive:    'm-inactive',
            providerActive: 'm-active'
        },
        content: {
            order:          'content__order',
            favourites:     'content__favourites'
        },
        favourites: {
            slider:         'm-column-slider'
        },
        order: {
            luch:           'content__order-restaurant',
            slimming:       'content__order-slimming'
>>>>>>> 93c4180cdc318809252dbf9812c7b6a7e1cfba6b
        }
    },
    els:{
        page:null,
        wrapper:null,
        header:{},
        content:{}
    },
<<<<<<< HEAD
    templates:{
        page:_.template($('#template_page').html()),
        header:_.template($('#template_header').html()),
        menu:{},
        order:{},
        favourites:{}
=======
    templates: {
        page: _.template($('#template_page').html()),
        header: _.template($('#template_header').html()),
        headerProvider: _.template($('#template_header-provider').html()),
        menu: {},
        order: {},
        favourites: {}
>>>>>>> 93c4180cdc318809252dbf9812c7b6a7e1cfba6b
    },
    objects:null,
    menu:null,
    defaults:{
        day:'monday',
        provider:'fusion'
    },

    initialize:function () {

        this.els.page = $(this.selectors.page);
        this.els.wrapper = $(this.selectors.wrapper);
        this.els.wrapper.html(this.templates.page());

        this.els.header.container = $(this.selectors.header.container);
        this.els.content.container = $(this.selectors.content.container);
        this.els.content.wrapper = $(this.selectors.content.wrapper);

        this.model.fetch({
            success:$.proxy(this.modelFetchSuccess, this),
            error:$.proxy(this.modelFetchError, this)
        });

        this.model.bind('change:page', this.renderContent, this);
        this.model.bind('change:options', this.renderContent, this);

        //console.log('app view init:', this.page, this.model, this.model.get('objects'));

    },
    modelFetchSuccess:function () {

        this.objects = this.model.get('objects');
        this.menu = this.getMenu();
        this.options = {};
        this.render();

        //this.objects[0].weekday = 'Воскресенье'
        //delete this.objects[1].providers.fusion;
        //console.log('--- delete', this.objects[1]);

        console.log('model fetch success:', this.model, this.objects, this.options);

    },
    modelFetchError:function () {

        // show error
        console.log('model fetch error:', this.model.get('objects'));
    },
    getMenu:function () {

        var config = {

            days:{
                'понедельник':'monday',
                'вторник':'tuesday',
                'среда':'wednesday',
                'четверг':'thursday',
                'пятница':'friday',
                'суббота':'saturday',
                'воскресенье':'sunday'
            },
            providers:{
                'fusion':'fusion',
                'hleb-sol.ru':'hlebsol'
            },
            categories:{
                'первые блюда':'primary',
                'вторые блюда':'secondary',
                'горячие блюда':'secondary',
                'салаты':'snack',
                'холодные блюда и закуски':'snack',
                'бутерброды, выпечка':'dessert',
                'пирожное':'dessert',
                'прочее':'misc'
            },
            standardizedCategories:{
                primary:'Первые блюда',
                secondary:'Горячие блюда',
                snack:'Холодные блюда и закуски',
                dessert:'Бутерброды и выпечка',
                misc:'Прочее'
            },
            categoriesOrder:{
                primary:0,
                secondary:1,
                snack:2,
                dessert:3,
                misc:4
            }
        },
<<<<<<< HEAD
            trim = function (str) {
                return str.toLowerCase().replace(/\s+/g, ' ');
            },
            weekMenu = {};
=======
        trim = function(str){

            return str
                    .toLowerCase()
                    .replace(/^\s+/, '')
                    .replace(/\s+$/, '')
                    .replace(/\s+/g, ' ');
        },
        weekMenu = {};
>>>>>>> 93c4180cdc318809252dbf9812c7b6a7e1cfba6b

        _.each(this.objects, function (day) {

            var weekday = config.days[ trim(day.weekday) ],
                dayMenu = weekMenu[ weekday ] = {};

            _.each(day.providers, function (categories, provider) {

                var providerMenu = dayMenu[provider] = {};

                _.each(categories, function (dishes, category) {

                    var categoryName = config.categories[ trim(category) ],
                        categoryMenu = providerMenu[categoryName] = {
                            name:config.standardizedCategories[categoryName],
                            order:config.categoriesOrder[categoryName],
                            dishes:dishes
                        };

                });
            });
        });


        console.log('set menu:', weekMenu);

        return weekMenu;

    },

    correctOptions:function (options) {
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
                day:options.day || 'monday',
                provider:options.provider || 'fusion'
            },
            check = function () {

                if (menu[defaults.day] && menu[defaults.day][defaults.provider]) {
                    return;
                }
                else {

                    if (menu[defaults.day]) {
                        if (!menu[defaults.provider]) {
                            for (var provider in menu[defaults.day]) {
                                defaults.provider = provider;
                                break;
                            }
                        }
                    }
                    else {
                        for (var i = 0, l = order.length; i < l; i++) {
                            if (menu[order[i]]) {
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
    render:function () {

        if (!this.menu) return;

        this.renderHeader();
        this.renderContent();

        console.log('app view render:', this.menu, this.model, arguments);

    },
    renderContent:function () {

        if (!this.menu) return;

        this.page = this.model.get('page') || { menu:true };
        console.log('--- this page is', this.page);


        this.page.menu && this.renderMenu();
        this.page.order && this.renderOrder();
        this.page.favourites && this.renderFavourites();

        console.log('render content:', this.model, this.page, this.menu);

    },
    renderHeader:function () {

        this.els.header.container.html(this.templates.header());
        this.els.header.providers = $(this.selectors.header.providers);
        this.els.header.day = $(this.selectors.header.day);
        this.els.header.dayTitle = $(this.selectors.header.dayTitle);
        this.els.header.dayActionsItem = $(this.selectors.header.dayActionsItem);


        this.els.header.day
            .addClass(this.classes.header.dayInactive);


        _.each(this.menu, function (providers, day) {
            this.els.header.day
                .filter('[rel=' + day + ']')
                .removeClass(this.classes.header.dayInactive);
        }, this);


        this.els.header.day
            .not('.' + this.classes.header.dayInactive)
            .find(this.els.header.dayTitle)
            .click($.proxy(function (event) {
            this.hideDayActions();
            this.showDayActions(event);
        }, this));


        this.els.page.bind('click keydown', $.proxy(function (event) {
            var target = $(event.target),
                condition = ( event.type === 'click' && !target.parents().is(this.selectors.header.day) ) ||
                    ( event.type === 'keydown' && event.which === 27 );
            condition && this.hideDayActions(event);
        }, this));


        this.els.header.dayActionsItem.click($.proxy(this.selectDayAction, this));

        console.log('render header:', this.els.header.container, this.model.get('objects'));

    },
    showDayActions:function (event) {
        $(event.target)
            .parents(this.selectors.header.day)
            .addClass(this.classes.header.dayOpened);
    },
    hideDayActions:function () {
        this.els.header.day
            .removeClass(this.classes.header.dayOpened);
    },
    selectDayAction:function (event) {

        var target = $(event.target);
        target
            .parents(this.selectors.header.day)
            .find(this.els.header.dayComment)
            .html(target.html());

        this.hideDayActions();
    },
    toggleProvider:function (event) {

        this.els.header.provider
            .removeClass(this.classes.header.providerActive);

        $(event.currentTarget)
            .addClass(this.classes.header.providerActive);

    },
    resetPage:function () {

        _.each(this.classes.page, function (className) {
            this.els.page.removeClass(className);
        }, this);

        _.each(this.classes.content, function (className) {
            this.els.content.wrapper.removeClass(className);
        }, this);

    },
    renderMenu:function () {

        var options = this.model.get('options') || {},
            corrected = this.correctOptions(options),
            menuHTML = [],
            menu = [],
            day,
            provider,
            isOptionsCorrect =
                options.day && options.provider &&
                    options.day === corrected.day &&
                    options.provider === corrected.provider;

        if (isOptionsCorrect) {
            console.log('options CORRECT:', options.day, options.provider, '\n\n');
            this.options = options;
        }
        else {
            console.log('options INCORRECT:', '#/menu/' + corrected.day + '/' + corrected.provider + '/', '\n\n');
            document.location.hash = '#/menu/' + corrected.day + '/' + corrected.provider + '/';
            this.model.set({
                options:{
                    day:corrected.day,
                    provider:corrected.provider
                }
            });
            return;
        }

        console.log('render menu TOP:', this.options.day, this.options.provider, this.menu);


        day = this.options.day;
        provider = this.options.provider;


        _.each(this.menu[day][provider], function (item) {
            menu.push(item);
        });


        menu.sort(function (a, b) {
            return a.order < b.order ? -1 : 1;
        });




        _.each(this.menu[day], $.proxy(function(provider, day){

            



        }, this));


        this.els.header.provider = $(this.selectors.header.provider);
        this.els.header.providerName = $(this.selectors.header.providerName);

        this.els.header.provider.click($.proxy(this.toggleProvider, this));





        this.els.header.provider
            .removeClass(this.classes.header.providerActive)
            .filter('[rel=' + this.options.provider + ']')
            .addClass(this.classes.header.providerActive);

        this.els.header.providerName.each(function () {

            var element = $(this),
                href = element.attr('href'),
                newHref = href.replace(/^(#\/menu\/)[a-z]+(\/[a-z]+)/, '$1' + day + '$2');
            element.attr({ href:newHref });
        });


        this.templates.menu.group = _.template($('#template_menu-group').html());
        this.templates.menu.item = _.template($('#template_menu-item').html());


        _.each(menu, function (items) {

            console.log('--- dishes ', items);

            var groupHTML = [];

            _.each(items.dishes, function (dish) {
                groupHTML.push(this.templates.menu.item(dish));
            }, this);

            menuHTML.push(this.templates.menu.group({
                name:items.name,
                order:items.order,
                items:groupHTML.join('')
            }));

        }, this);

        this.resetPage();

        this.els.content.wrapper
            .empty()
            .append(menuHTML.join(''))
            .hide()
            .fadeIn();

        console.log('render menu:', menu, day, provider);

    },
    renderOrder:function () {

        var example = { // TODO: save in local storage
            monday:{
                order:[],
                luch:true,
                nothing:false
            },
            tuesday:{
                order:[],
                luch:false,
                nothing:true
            },
            wednesday:{
                order:[
                    {
                        id:20115,
                        name:"Бутерброд с ветчиной",
                        price:40,
                        weight:"35/30"
                    },
                    {
                        id:20116,
                        name:"Бутерброд с сыром",
                        price:40,
                        weight:"35/30"
                    },
                    {
                        id:20117,
                        name:"Бутерброд с семгой ",
                        price:90,
                        weight:"30/5/5/30"
                    }
                ],
                luch:false,
                nothing:false
            },
            thursday:{
                order:[
                    {
                        id:20118,
                        name:"Пирожок с вишней",
                        price:25,
                        weight:"60.0"
                    },
                    {
                        id:20119,
                        name:"Пирожок с яблоком",
                        price:25,
                        weight:"60.0"
                    },
                    {
                        id:20120,
                        name:"Пирожок с капустой",
                        price:25,
                        weight:"60.0"
                    }
                ],
                luch:false,
                nothing:false
            },
            friday:{
                order:[
                    {
                        id:20121,
                        name:"Пирожок с мясом",
                        price:25,
                        weight:"60.0"
                    },
                    {
                        id:20122,
                        name:"Ватрушка с творогом",
                        price:25,
                        weight:"60.0"
                    },
                    {
                        id:20123,
                        name:"Круассан с фрук. конфетюром",
                        price:25,
                        weight:"75.0"
                    }
                ],
                luch:false,
                nothing:false
            }
        };


        var orderHTML = [],
            order = [];


        var messages = { // TODO: move to global settings

            luch:{
                text:'Луч гламура',
                className:this.classes.order.luch
            },
            nothing:{
                text:'Худею',
                className:this.classes.order.slimming
            }
        },
            decline = { // TODO: move to global settings
                monday:'по понедельникам',
                tuesday:'по вторникам',
                wednesday:'по средам',
                thursday:'по четвергам',
                friday:'по пятницам',
                saturday:'по субботам',
                sunday:'по воскресеньям'
            };


        _.each(example, function (dayOrder, day) {
            order.push({
                day:day, // TODO: set russian day name
                dayIndex:0, // TODO: set weekday index
                order:dayOrder.order,
                luch:dayOrder.luch,
                nothing:dayOrder.nothing
            });
        });


        order.sort(function (a, b) {
            return a.weekday > b.weekday ? -1 : 1;
        });

        this.templates.order.group = {};
        this.templates.order.group.dishes = _.template($('#template_order-group-dishes').html());
        this.templates.order.group.message = _.template($('#template_order-group-message').html());
        this.templates.order.item = this.templates.menu.item || _.template($('#template_menu-item').html());


        _.each(order, function (dayOrder, day) {

            var dayOrderHTML = [],
                dayPrice = 0,
                dayMessage,
                groupTemplate = !dayOrder.order.length && ( dayOrder.luch || dayOrder.nothing )
                    ? this.templates.order.group.message
                    : this.templates.order.group.dishes;

            _.each(dayOrder.order, function (dish) {

                dayPrice += dish.price;
                dayOrderHTML.push(this.templates.order.item(dish));

            }, this);


            if (dayOrder.order.length && !dayOrder.luch && !dayOrder.nothing) {

                orderHTML.push(this.templates.order.group.dishes({
                    day:dayOrder.day,
                    price:dayPrice,
                    dishes:dayOrderHTML.join('')
                }));
            }
            else {

                dayMessage =
                    dayOrder.luch && messages.luch ||
                        dayOrder.nothing && messages.nothing;

                orderHTML.push(this.templates.order.group.message({
                    day:dayOrder.day,
                    dDay:decline[dayOrder.day],
                    text:dayMessage.text,
                    className:dayMessage.className,
                    dishes:dayOrderHTML.join('')
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
    renderFavourites:function () {

        var favourites = {},
            favouritesHTML = [];

        this.templates.favourites.container = _.template($('#template_favourites').html());
        this.templates.favourites.category = _.template($('#template_favourites-category').html());
        this.templates.favourites.item = _.template($('#template_favourites-item').html());


        _.each(this.menu, function (providers, day) {

            _.each(providers, function (categories, provider) {

                _.each(categories, function (menu, category) {

                    if (!favourites[category]) favourites[category] = [];

                    _.each(menu.dishes, function (dish) {

                        favourites[category].push({
                            id:dish.id,
                            name:dish.name,
                            provider:provider
                        });

                    }, this);

                }, this);

            }, this);

        }, this);


        _.each(favourites, function (category, categoryName) {

            var categoryHTML = [];

            category.sort(function (a, b) {
                return a.name > a.name ? -1 : 1;
            });

            _.each(category, function (dish) {
                categoryHTML.push(this.templates.favourites.item(dish));
            }, this);

            favouritesHTML.push(this.templates.favourites.category({
                name:categoryName,
                category:categoryName,
                items:categoryHTML.join('')
            }));

        }, this);


        this.resetPage();

        this.els.content.wrapper
            .empty()
            .addClass(this.classes.content.favourites)
            .append(this.templates.favourites.container({ categories:favouritesHTML.join('') }))
            .hide()
            .fadeIn();

        this.els.page.addClass(this.classes.page.favourites);

        console.log('render favourites:', this.model.get('objects'), '|', favourites);
    }
});


var Router = Backbone.Router.extend({

    routes:{
        '':'start',
        'menu/:day':'menu',
        'menu/:day/':'menu',

        'menu/:day/:provider':'menu',
        'menu/:day/:provider/':'menu',

        'order':'order',
        'order/':'order',

        'favourites':'favourites',
        'favourites/':'favourites'
    },
    page:{},
    options:{},

    start:function () {

        console.log('router start');

        this.page = { menu:true };
        this.refreshModel();
    },

    menu:function (day, provider) {

        console.log('router menu', day, provider);

        this.page = {
            menu:true
        };

        this.options = {
            provider:provider,
            day:day
        };

        this.refreshModel();
    },

    order:function () {

        console.log('router order');

        this.page = { order:true };
        this.refreshModel();
    },

    favourites:function () {

        console.log('router favourites');

        this.page = { favourites:true };
        this.refreshModel();
    },

    refreshModel:function (model) {

        console.log('refresh model:', this.page, this.options);

        app.model.set({
            page:this.page,
            options:this.options
        });

    }
});


$(function () {

    console.log('backbone init');

    window.app = new AppView({
        model:new AppModel()
    });

    window.router = new Router();

    Backbone.history.start();

});
