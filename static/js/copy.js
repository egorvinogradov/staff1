var Settings,
    Config,
    Models,
    Views;

Models = {
    start: null,
    menu: {
        monday: {
            fusion: null,
            hlebsol: null
        },
        tuesday: {
            fusion: null,
            hlebsol: null
        },
        wednesday: {
            fusion: null,
            hlebsol: null
        },
        thursday: {
            fusion: null,
            hlebsol: null
        },
        friday: {
            fusion: null,
            hlebsol: null
        },
        saturday: {
            fusion: null,
            hlebsol: null
        },
        sunday: {
            fusion: null,
            hlebsol: null
        }
    },
    favourites: null,
    order: null
};

Views = {
    overlay: null,
    menu: null,
    favourites: null,
    order: null
};

Config = [{
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'monday',
        url: ['/menu/monday/hlebsol'],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    },
    {
        name: 'start',
        url: ['/', ''],
        model: Models.start,
        view: Views.overlay
    }

];



