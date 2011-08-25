/* Author: Max Degterev @suprMax
*/

Meals.settings = {
	min_weekly_portions: 17,
	max_rand_num: 2,
	supports_inputtype_number: $('<input />', {type: 'number'}).get()[0].type === 'number'
};
Meals.supports = {
	inputtype_number: $('<input />', {type: 'number'}).get()[0].type === 'number'
};
Meals.init = function() {
	$('html').removeClass('no-js').addClass('js');
}();
Meals.inputs = function() {
	if (!Meals.supports.inputtype_number) {
		$('html').addClass('no-inputtypes-number');

		$('input[type="number"]').each(function(){
			var el = $(this),
				min = +el.attr('min'),
				max = +el.attr('max'),
				step = +el.attr('step'),
				disabled = el.attr('disabled'),
				lock = true, // Locking disables lots of key combinations, like Ctrl+V.
				fr = $('<span class="num-shim" style="position: absolute;"><span class="up" style="display: block; cursor: pointer;">&#9650;</span><span class="down" style="display: block; cursor: pointer;">&#9660;</span></span>');
				// Don't forget to position .num-shim in CSS.	

			el.wrap('<span class="num-shim-cont" />');
			
			disabled && el.parent().addClass('disabled');
	
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
				$(this).hasClass('up') ? valUpdate(step) : valUpdate(-step);
			});
			
			function valUpdate(num) {
				if (el.attr('disabled')) {
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

//    $('span.fake-radio').each(function() {
//        var cont = $(this),
//            input = cont.find('input');
//
//        input.bind('change', function() {
//            var el = $(this),
//                cont = $(this).parent();
//
//           $('input[name="'+el.attr('name')+'"]')
//           .parent()
//           .removeClass('active');
//
//            cont.addClass('active');
//        });
//
//        if (input.is(':checked') && !cont.hasClass('active')) {
//            input.trigger('change');
//        }
//    });

	$('div.fake-select').each(function() {
        var wrap = $(this),
            select = wrap.find('select'),
            options = select.find('option'),
            label = wrap.find('label'),
            cont = wrap.find('.selector'),
            curr = cont.find('.current'),
            ul = cont.find('ul'),
            fragment = '';

        options.each(function() {
			var el = $(this);
			fragment += '<li' + ((options.length - 1 == this.index) ? ' class="last"' : '') + ' data-val="' + el.val() + '">' + el.html() + '</li>';
        });

        cont.bind('click', function(e) {
            e.stopPropagation();
            cont.toggleClass('active');
			curr.toggleClass('active');
        });

        ul
		.append(fragment)
		.find('li').bind('click', function(e) {
			e.stopPropagation();
			
			var el = $(this),
			    li = ul.find('li');

			select
			    .val(el.data('val'))
			    .trigger('change');

			cont.trigger('click');
		});

        select.bind('change', function() {
            curr.text(ul.find('li[data-val="'+select.val()+'"]').text());
        });

        label.bind('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cont.trigger('click');
        });

        select.trigger('change');

        $(document).bind('click', function(e) {
            var target = e.target,
                $target = $(target);

            if (cont.hasClass('active') && !$target.is(cont) && !$target.is(label)) {
                cont.trigger('click');
            }
        });
    });	
}();
Meals.logic = function () {
	var form = $('#order_form'),
		days = form.find('div.day-segment'),
		titles = days.find('.title.script'),
		next_day = days.find('a.next_day'),
		dishes = days.find('.dishes'),
		checkboxes = dishes.find('input[type="checkbox"]'),
		attempts = 0,
		submit = $('#submit'),
		randomize = form.find('.script.randomize');
		
	titles.bind('click', function() {
		var el = $(this),
			slider = el.next('.slider'),
			state = el.hasClass('active');
		
		if (state) {
			el.removeClass('active');
			slider.slideUp(200);
		}
		else {
			el.addClass('active');
			slider.slideDown(200);
		}
	});
	
	next_day.bind('click', function(e) {
		e.preventDefault();
		
		days.each(function() {
			$(this)
				.find('h3.title.script.active')
				.trigger('click'); // Best way since we can change sliding animation and forget to change it here. Yes, we are mere humans
		});
		
		$(this)
			.parents('div.day-segment')
			.next('div.day-segment')
			.find('h3.title.script')
			.trigger('click');
	});
	
	// Do stuff when checkbox is checked
	checkboxes.bind('change', triggerCheckbox);
	
	// Dumbas browsers compensation (Firefox, I'm looking at you intently)
	checkboxes.each(function() {
		$(this).is(':checked') && triggerCheckbox.apply(this);
	});
	
	function triggerCheckbox() {
		var el = $(this),
			li = el.parents('li').filter(':first'),
			num = li.find('input[type="number"]');
			
		if (el.is(':checked')) {
			li.addClass('selected');
			
			// Cannot be checked with zero value
			(+num.val() < 1) && num.val(el.val()).trigger('change');

			// Reset input field
			num.removeAttr('data-status').removeAttr('disabled');
			
			// Reset attempts counter
			attempts = 0;
			submit.html(submit.data('norm'));

			Meals.supports.inputtype_number || num.parent().removeClass('disabled');
		}
		else {
			li.removeClass('selected');

			(+num.val() > 0) && num.attr('data-status', 'remove');
			num.attr('disabled', 'disabled');

			Meals.supports.inputtype_number || num.parent().addClass('disabled');
		}
	}
	
	randomize.bind('click', function(e) {
		e.preventDefault();
		// going through menu day by day
		days.each(function() {
			var dishes = $(this).find('.dishes'),
				cat_counter = 1;
			
			// going through daily menu category after category
			dishes.each(function(){
				if (cat_counter == dishes.length) { // don't want to order soda and spoons
					return;
				}
			
				var el = $(this),
					items = el.find('input[type="checkbox"]'),
					count = items.length,
					rnum = 0,
					amount = Math.floor(Math.random() * Meals.settings.max_rand_num),
					i = 0;
					
				for (NaN; i <= amount; i++) { 
					rnum = Math.floor(Math.random() * (count - 1));
					
					items.eq(rnum).is(':checked') || items.eq(rnum).attr('checked', 'checked').trigger('change');
				}
			
				cat_counter++;
			});
		});
		// Inform the user
		$('#main')
			.find('ul.messages')
			.hide()
			.html('<li class="info"><span class="icon">&nbsp;</span>Твое меню чемпионов готово к отправке!</li>')
			.fadeIn(200);
	});

	// Checkboxes being able to actually remove something
	form.submit(function(e) {
		var hideout = form.find('div.hideout');
			temp_str = '',
			count = 0;
		
		dishes.find('input[type="number"]').each(function() {
			var el = $(this);
			
			if (el.attr('data-status') == 'remove') {
				temp_str += '<input type="hidden" name="' + el.attr('name') + '" value="0" />';
			}
			else {
				count += +el.val();
			}
		});
		
		hideout.html(temp_str);

		if (count < Meals.settings.min_weekly_portions && attempts < 1) {
			e.preventDefault();
			if (count === 0) {
				form.find('.form-errors').html('<li><span class="icon">&nbsp;</span>Дружище, выбери что-нибудь покушать. Не стесняйся.</li>').fadeIn(300);
			}
			else {
				if (Meals.username == 'marat') {
					temp_str = '<li><span class="icon">&nbsp;</span>Маратик, выбрано позиций: <strong>' + count + '</strong>. Закажи побольше, все равно ведь половину съедят!</li>';
				}
				else {
					temp_str = '<li><span class="icon">&nbsp;</span>Бро, выбрано позиций: <strong>' + count + '</strong>. Надумал воровать еду у Марата? Подтверди выбор повторным нажатием!</li>';
				}
				
				form.find('.form-errors').html(temp_str).fadeIn(200);
				attempts++;
				submit.html(submit.data('alt'));
			}
		}
	});
}();
Meals.extras = function() {
	// Some logic required for back-end to work properly (dunno why & wtf)
	$('.change_user select').bind('change', function() { this.form.submit(); });
}();
