/* Author: Max Degterev @suprMax
*/

var Meals = {};

Meals.inputs = function() {
	if (!Modernizr.inputtypes.number) {
		$('html').addClass('no-inputtypes-number');

		$('input[type="number"]').each(function(){
			var el = $(this),
				min = +el.attr('min'),
				max = +el.attr('max'),
				step = +el.attr('step'),
				disabled = !!el.attr('disabled'),
				lock = true, // Locking disables lots of key combinations, like Ctrl+V.
				fr = $('<span class="num-shim" style="position: absolute;"><span class="up" style="display: block; cursor: pointer;">&#9650;</span><span class="down" style="display: block; cursor: pointer;">&#9660;</span></span>');
				// Don't forget to position .num-shim in CSS.	

			el.wrap('<span class="num-shim-cont" />');
			
			if (disabled) {
				el.parent().addClass('disabled');
			}
	
			el.bind('change', function() {
				var val = +el.val() || 0;
				
				el.val(Math.min(Math.max(min, val), max));
			});
			
			el.bind('keydown', function(e) {
				// 	↑ ↓	 keys
				if (e.keyCode === 38) {
					valUpdate(step);
				}
				if (e.keyCode === 40) {
					valUpdate(-step);
				}

				if (lock) {
					// Backspace, enter, escape, delete
					if ($.inArray(e.keyCode, [8, 13, 27, 46]) !== -1) return;

					// Disable input of anything except numbers
					if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
						e.preventDefault();
					}
				}
			});

			fr
			.insertAfter(el)
			.find('span')
			.bind('click', function() {
				if ($(this).hasClass('up')) {
					valUpdate(step);
				}
				else {
					valUpdate(-step);
				}
			});
			
			function valUpdate(num) {
				if (!!el.attr('disabled')) {
					return;
				}
				el.val(+el.val() +num).trigger('change');
			}			
		});
	}

    $('span.fake-checkbox').each(function() {
        var cont = $(this),
            input = cont.find('input');

        input.bind('change', function() {
            cont.toggleClass('active');
        });

        if (input.is(':checked') && !cont.hasClass('active')) {
            input.trigger('change');
        }
    });

    $('span.fake-radio').each(function() {
        var cont = $(this),
            input = cont.find('input');

        input.bind('change', function() {
            var el = $(this),
                cont = $(this).parent();

           $('input[name="'+el.attr('name')+'"]')
           .parent()
           .removeClass('active');

            cont.addClass('active');
        });

        if (input.is(':checked') && !cont.hasClass('active')) {
            input.trigger('change');
        }
    });

	$('div.fake-select').each(function() {
        var wrap = $(this),
            select = wrap.find('select'),
            options = select.find('option'),
            label = wrap.find('label'),
            cont = wrap.find('.selector'),
            curr = cont.find('.current'),
            ul = cont.find('ul'),
            fragment = document.createDocumentFragment();

        options.each(function() {
            var li = fragment.appendChild(document.createElement('li'));
            li.appendChild(document.createTextNode(this.innerHTML));
            li.setAttribute('data-val', this.value);

            if (options.length - 1 == this.index) {
                li.className += " last";
            }
        });

        cont.bind('click', function(e) {
            // Lol hack
            e.stopPropagation();
            cont.toggleClass('active');
			curr.toggleClass('active');
        });

        ul
		.append(fragment)
		.find('li').bind('click', function(e) {
			var el = $(this),
			    li = ul.find('li');

			// Lol hack
			e.stopPropagation();

			select
			    .val(el.data('val'))
			    .trigger('change');

			cont.trigger('click');
		});

        select.bind('change', function() {
            var selected = ul.find('li[data-val="'+select.val()+'"]');
            curr.text(selected.text());
        });

        label.bind('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cont.trigger('click');
        });

        select.trigger('change');

        $(document).bind('click', function(e) {
            var target = e.target,
                jtarget = $(target);

            if (cont.hasClass('active') && !jtarget.is(cont) && !jtarget.is(label)) {
                cont.trigger('click');
            }
        });
    });	
}();
Meals.logic = function () {
	var days = $('div.day-segment'),
		titles = days.find('.title.script'),
		next_day = days.find('a.next_day'),
		dishes = days.find('.dishes'),
		checkboxes = dishes.find('input[type="checkbox"]'),
		amounts = dishes.find('input[type="number"]');
		
	titles.bind('click', function() {
		var el = $(this),
			slider = el.next('.slider'),
			state = el.hasClass('active');
		
		if (state) {
			el.removeClass('active');
			slider.slideUp(600);
		}
		else {
			el.addClass('active');
			slider.slideDown(600);
		}
	});
	
	next_day.bind('click', function(e) {
		e.preventDefault();
		
		var el = $(this),
			cont = el.parents('div.day-segment'),
			next = cont.next('div.day-segment');
		
		days.each(function() {
			var el = $(this),
				title = el.find('h3.title.script.active');
			
			title.trigger('click');
		});
		
		next.find('h3.title.script').trigger('click');
	});
	
	// Do stuff when checkbox is checked
	checkboxes.bind('change', triggerCheckbox);
	
	// Dumbas browsers compensation (Firefox, I'm looking at you intently)
	checkboxes.each(function() {
		var el = $(this),
			status = el.is(':checked');
		
		status && triggerCheckbox.apply(this);
	});
	
	function triggerCheckbox() {
		var el = $(this),
			li = el.parents('li').filter(':first'),
			num = li.find('input[type="number"]'),
			num_val = +num.val();
			
		if (el.is(':checked')) {
			li.addClass('selected');
			
			if (num_val < 1) {
				num.val(1);
				num.trigger('change');
			}
			
			num.removeAttr('disabled');
			if (!Modernizr.inputtypes.number) {
				num.parent().removeClass('disabled');
			}
		}
		else {
			li.removeClass('selected');
		
			num.attr('disabled', 'disabled');
			if (!Modernizr.inputtypes.number) {
				num.parent().addClass('disabled');
			}
		}
	}
}();

// Some logic required for back-end to work properly (dunno why & wtf)
$('.change_user select').bind('change', function() { this.form.submit(); });











