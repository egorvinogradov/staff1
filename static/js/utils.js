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
    }
});
