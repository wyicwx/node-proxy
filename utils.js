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
	var newList = [], tmp;
	for(var i in list) {
		tmp = clone(list[i]);
		tmp['match'] = this.dealStr(i);
		tmp['originalMatch'] = i;
		newList.push(tmp);
    }
    return newList;
}