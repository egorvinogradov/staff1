String.prototype.capitalize = function(){
    return this[0].toUpperCase() + this.substr(1);
};

$.extend({
    trimAll: function(str){
        return str
            .toLowerCase()
            .replace(/^\s+/, '')
            .replace(/\s+$/, '')
            .replace(/\s+/g, ' ');
    },
    random: function(number){
        return Math.round( Math.random() * number );
    },
    format: function(number, divider){
        var num = +number;
        num = num.toString().split('.');
        divider = divider || ',';
        return num[1]
            ? num[0] + divider + num[1]
            : num[0];
    },
    parseDate: function(str){
        var arr = str.split('-');
        return new Date(+arr[0], +arr[1] - 1, +arr[2]);
    }
});


$.fn.extend({
    mediaQueries: function(){

        var element = this.first(),
            timer = false,
            handler = function(){

                var width = element.width(),
                    page = $(config.selectors.page),
                    classes = config.classes.additional,
                    isMedia1000 = page.hasClass(classes.media1000),
                    isMedia1500 = page.hasClass(classes.media1500);

                if ( width <= 1000 ) {
                    page
                    .addClass(classes.media1000)
                    .addClass(classes.media1500);
                }

                if ( width > 1000 && width <= 1500 ) {
                    page
                    .removeClass(classes.media1000)
                    .addClass(classes.media1500);
                }

                if ( width > 1500 ) {
                    page
                    .removeClass(classes.media1000)
                    .removeClass(classes.media1500);
                }
            };

        element.resize(function(){

            if ( timer ) return false;
            timer = true;

            setTimeout(function(){
                timer = false;
                handler();
            }, 200);
        });

        handler();
    }
});

