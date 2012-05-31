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
    }
});
