exports.dealStr = function(str) {
    ['\\\\','\\.','\\?','\\+','\\$','\\^','\\/','\\{','\\}','\\,','\\)','\\(','\\=','\\!'].forEach(function(value) {
        str = str.replace(new RegExp(value, 'gi'), value);
    });
    str = str.replace(/\*/g, '.*');
    return new RegExp(str);
}

function clone(obj) {
	var o = {};
	for(var i in obj) {
		if(obj.hasOwnProperty(i)) {
			o[i] = obj[i];
		}
	}
	return o;
}

exports.dealList = function(list) {
	var newList = [];
	for(var i in list) {
		newList[i] = clone(list[i]);
        newList[i]['fileName'] = this.dealStr(newList[i]['fileName']);
    }
    return newList;
}