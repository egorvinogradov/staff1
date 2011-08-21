/* Author: Max Degterev @suprMax
*/

var Meals = {
	min_weekly_portions: 21,
	max_rand_num: 3,
	supports_inputtype_number: $('<input />', {type: 'number'}).get()[0].type === 'number'
};
Meals.init = function() {
	$('html').removeClass('no-js').addClass('js');
}();
Meals.inputs = function() {
	if (!Meals.supports_inputtype_number) {
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
		$(this).is(':checked') && triggerCheckbox.apply(this);
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
			num.removeAttr('data-status');
			
			// Need to recalculate number of positions in menu
			attempts = 0;
			submit.html(submit.data('norm'));
			
			num.removeAttr('disabled');
			if (!Meals.supports_inputtype_number) {
				num.parent().removeClass('disabled');
			}
		}
		else {
			li.removeClass('selected');
		
			num.attr('disabled', 'disabled');
			if (!Meals.supports_inputtype_number) {
				num.parent().addClass('disabled');
			}
			
			if (+num.val() > 0) {
				num.attr('data-status', 'remove');
			}
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
					amount = Math.floor(Math.random() * Meals.max_rand_num),
					item;
					
				for (i = 0; i <= amount; i++) {
					rnum = Math.floor(Math.random() * (count - 1));
					item = items.eq(rnum);
					
					if (!item.is(':checked')) {
						item.attr('checked', 'checked');
						item.trigger('change');
					}
				}
			
				cat_counter++;
			});
		});
	});

	// Checkboxes being able to actually remove something
	form.submit(function(e) {
		var hideout = form.find('div.hideout');
			tb_removed = '',
			count = 0;
		
		dishes.find('input[type="number"]').each(function() {
			var el = $(this);
			
			if (el.attr('data-status') == 'remove') {
				tb_removed += '<input type="hidden" name="' + el.attr('name') + '" value="0" />';
			}
			else {
				count += +el.val();
			}
		});
		
		hideout.html(tb_removed);

		if (count < Meals.min_weekly_portions && attempts < 1) {
			e.preventDefault();
			if (count === 0) {
				form.find('.form-errors').hide().html('<li><span class="icon">&nbsp;</span>Дружище, выбери что-нибудь покушать. Не стесняйся.</li>').fadeIn(300);
			}
			else {
				form.find('.form-errors').hide().html('<li><span class="icon">&nbsp;</span>Бро, выбрано позиций: <strong>' + count + '</strong>. Надумал воровать еду у Марата? Подтверди выбор повторным нажатием!</li>').fadeIn(300);
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
