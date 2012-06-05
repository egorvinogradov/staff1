var config = {

    selectors: {
        page:       '.page',
        wrapper:    '.page__wrapper',
        header: {
            container:      '.header',
            day:            '.header__day',
            dayTitle:       '.header__day-title',
            dayActions:     '.header__day-variants',
            dayActionsItem: '.header__day-select-item',
            dayRestaurant:  '.header__day-restaurant',
            daySlimming:    '.header__day-none',
            dayComment:     '.header__day-comment',
            dayPriceBig:    '.header__day-price-big',
            providers:      '.header__providers',
            providerList:   '.header__providers-list',
            provider:       '.header__provider',
            providerName:   '.header__provider-c',
            completeButton: '.header__complete-button'
        },
        content: {
            container:      '.content',
            wrapper:        '.content__wrapper'
        },
        menu: {
            groupList:      '.content__menu-list',
            groupHeader:    '.content__menu-header',
            item: {
                container:  '.content__menu-item',
                name:       '.content__menu-name',
                count:      '.content__menu-count',
                number:     '.content__menu-number',
                plus:       '.content__menu-plus',
                minus:      '.content__menu-minus'
            }
        },
        favourites: {
            item:           '.content__favourites-item'
        },
        overlay:            '.content__overlay'
    },
    classes: {
        page: {
            order:          'm-order',
            favourites:     'm-favourites'
        },
        header: {
            dayOpened:          'm-opened',
            dayActive:          'm-active',
            dayHasPrice:        'm-has-price',
            dayCompleted:       'm-completed',
            dayInactive:        'm-inactive',
            providerActive:     'm-active',
            providersInactive:  'm-inactive'
        },
        content: {
            order:          'content__order',
            favourites:     'content__favourites'
        },
        menu: {
            selected:       'm-selected',
            countOne:       'm-one'
        },
        overlay: {
            start:          'm-overlay-start',
            none: {
                day:        'm-overlay-day-slimming',
                week:       'm-overlay-week-slimming'
            },
            restaurant: {
                day:        'm-overlay-day-restaurant',
                week:       'm-overlay-week-restaurant'
            },
            attention:      'm-overlay-attention'
        },
        favourites: {
            slider:         'm-column-slider',
            selected:       'm-selected'
        },
        order: {
            restaurant:     'content__order-restaurant',
            none:       'content__order-slimming'
        }
    },
    text: {
        daysRu2En: {
            'понедельник':  'monday',
            'вторник':      'tuesday',
            'среда':        'wednesday',
            'четверг':      'thursday',
            'пятница':      'friday',
            'суббота':      'saturday',
            'воскресенье':  'sunday'
        },
        daysEn2Ru: {
            monday:     'понедельник',
            tuesday:    'вторник',
            wednesday:  'среда',
            thursday:   'четверг',
            friday:     'пятница',
            saturday:   'суббота',
            sunday:     'воскресенье'
        },
        daysEn2RuInflect1: {
            monday:     'по понедельникам',
            tuesday:    'по вторникам',
            wednesday:  'по средам',
            thursday:   'по четвергам',
            friday:     'по пятницам',
            saturday:   'по субботам',
            sunday:     'по воскресеньям',
            week:       'всю неделю'
        },
        daysEn2RuInflect2: {
            monday:     'с понедельника',
            tuesday:    'со вторника',
            wednesday:  'со среды',
            thursday:   'с четверга',
            friday:     'с пятницы',
            saturday:   'с субботы',
            sunday:     'с воскресенья'
        },
        categoriesEn2Ru: {
            primary:    'Первые блюда',
            secondary:  'Горячие блюда',
            snack:      'Холодные блюда и закуски',
            dessert:    'Бутерброды и выпечка',
            misc:       'Прочее'
        },
        categoriesEn2RuShort: {
            primary:    'Первое',
            secondary:  'Второе',
            snack:      'Салаты',
            dessert:    'Выпечка',
            misc:       'Прочее'
        },
        categoriesRu2En: {
            'первые блюда':             'primary',
            'вторые блюда':             'secondary',
            'горячие блюда':            'secondary',
            'прочее':                   'misc',
            'салаты':                   'snack',
            'холодные блюда и закуски': 'snack',
            'бутерброды, выпечка':      'dessert',
            'пирожное':                 'dessert'
        }
    }
};
