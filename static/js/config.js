var config = {

    selectors: {
        page:       '.page',
        wrapper:    '.page__wrapper',
        header: {
            container:      '.header',
            week:           '.header__week',
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
            completeButton: '.header__complete-button',
            favourites:     '.header__favourites-select',
            changeOrder:    '.header__change',
            message:        '.header__message'
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
                minus:      '.content__menu-minus',
                price:      '.content__menu-price-big'
            }
        },
        favourites: {
            category:       '.content__favourites-category',
            blank:          '.content__favourites-category-blank',
            item:           '.content__favourites-item',
            save:           '.content__favourites-save',
            order:          '.content__favourites-order'
        },
        overlay:            '.content__overlay',
        attention: {
            confirm:        '.content__overlay-attention-ok',
            cancel:         '.content__overlay-attention-cancel'
        }
    },
    classes: {
        global: {
            hidden:         'm-hidden'
        },
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
            countOne:       'm-one',
            inactive:       'm-inactive'
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
            selected:       'm-selected',
            collapsed:      'm-small'
        },
        order: {
            restaurant:     'content__order-restaurant',
            none:           'content__order-slimming'
        },
        additional: {
            media1000:      'media-max-width_1000',
            media1500:      'media-max-width_1500'
        }
    },
    text: {
        monthsInflect: [
            'января',
            'февраля',
            'марта',
            'апреля',
            'мая',
            'июня',
            'июля',
            'августа',
            'сентября',
            'октября',
            'ноября',
            'декабря'
        ],
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
        },
        headerMessages: {
            menu:       'Что изволит кушать мисьё <%= name %> на неделе с <%= dateFrom %> по <%= dateTo %>?',
            favourites: 'Ваши любимые кушанья, мисьё <%= name %>!'
        }
    },
    DAY_ORDER_LIMIT: 400
};
