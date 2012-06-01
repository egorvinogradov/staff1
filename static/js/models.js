var AppModel = Backbone.Model.extend({
    defaults: {
        page: null,
        options: null
    }
});

var MenuModel = Backbone.Model.extend({
	url: '/api/v1/day'
});

var OrderModel = Backbone.Model.extend({
	url: '/api/v1/order/'
});

var FavouritesModel = Backbone.Model.extend({
	url: '/api/v1/favorite/'
});
