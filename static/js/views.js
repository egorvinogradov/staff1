var MealView = Backbone.View.extend({

    el: null,
	template: null,
	initialize: function(){

        this.el = $('.page');
        this.template = _.template($('#template_page').html());
        this.render();

        console.log('init page', this.model);

	},
	render: function(){

        this.el.append(this.template());
        this.header = $('.header');
        this.content = $('.content');

        var header = new HeaderView(this.header, this.model.get('order'));

        console.log('render page', header);




	}
});


var HeaderView = Backbone.View.extend({

    el: null,
    template: null,
    //model: new HeaderModel(),
    selectors: {
        body: 'body',
        day: '.header__day',
        dayTitle: '.header__day-title',
        dayActions: '.header__day-variants',
        providers: '.header__provider'
    },
    classes: {
        opened: 'm-opened',
        providerActive: 'm-active'
    },
    initialize: function(container, order){

        this.model.set({
            order: order
        });

        this.el = container;
        this.template = _.template($('#template_header').html());
        this.model.bind('change', this.render, this);
        this.render();

        console.log('init header', container, this.model);

    },
    render: function(){

        this.el.append(this.template());
        this.providers = $(this.selectors.providers);

        $(this.selectors.dayTitle).click($.proxy(function(event){
            this.hideDayActions();
            this.showDayActions(event);
        }, this));

        $(this.selectors.body).bind('click keydown', $.proxy(function(event){
            var target =    $(event.target),
                condition = ( event.type === 'click' && !target.parents().is(this.selectors.day) ) ||
                            ( event.type === 'keydown' && event.which === 27 );
            condition && this.hideDayActions(event);
        }, this));

        this.providers.click($.proxy(this.toggleProvider, this));
        






        console.log('render header', this.model, $('.header__day-title'));

    },
    showDayActions: function(event){
        $(event.target)
            .parents(this.selectors.day)
            .addClass(this.classes.opened);
    },
    hideDayActions: function(){
        $(this.selectors.day)
            .removeClass(this.classes.opened);
    },
    toggleProvider: function(event){

        var current =   this.providers.filter('.' + this.classes.providerActive),
            target =    $(event.currentTarget),
            provider =  target.data('provider');

        if ( current.is(target) ) return;

        this.providers.removeClass(this.classes.providerActive);
        target.addClass(this.classes.providerActive);


        console.log('toggle provider', $(event.currentTarget), provider);

    }

});



