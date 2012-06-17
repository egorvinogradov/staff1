AppView = Backbone.View.extend(
  el: config.selectors.wrapper
  els: {}
  template: _.template($("#template_page").html())
  initialize: ->
    $(@el).html @template()
    @els.page = $(config.selectors.page)
    @els.header = $(config.selectors.header.container, @el)
    @els.content = $(config.selectors.content.container, @el)
    @els.wrapper = $(config.selectors.content.wrapper, @el)
    @model.bind "change", @toggle, this
    @header = new HeaderView
      el: @els.header
      page: @page
      options: @options
      app: this


  toggle: ->
    page = @model.get("page")
    options = @model.get("options")
    params = undefined

    unless _.isEqual(@page, page)
      console.log "APP THIS RENDER", page, options
      @page = @model.get("page")
      @options = @model.get("options")
      @render()

    else
      unless _.isEqual(@options, options)
        console.log "APP THIS PART-RENDER", page, options
        params =
          page: page
          options: options

        @menu.render params  if page.menu
        @order.render params  if page.order
        @favourites.render params  if page.favourites
        @page = @model.get("page")
        @options = @model.get("options")

  render: (page) ->
    if @page.menu
      @menu = new MenuView(
        model: new MenuModel()
        el: @els.wrapper
        app: this
      )
    if @page.order
      @order = new OrderView(
        model: new OrderModel()
        el: @els.wrapper
        app: this
      )
    if @page.favourites
      @favourites = new FavouritesView(
        model: new FavouritesModel()
        el: @els.wrapper
        app: this
      )

  resetPage: ->
    _.each config.classes.page, ((className) ->
      @els.page.removeClass className
    ), this
    _.each config.classes.content, ((className) ->
      @els.content.removeClass className
      @els.wrapper.removeClass className
    ), this

  fetchModel: (model, callback, context) ->
    model.fetch
      success: $.proxy(callback, context or window)
      error: (error) ->
        console.log "FETCH MODEL ERROR", error

  getLocalData: (key) ->
    value = undefined
    if typeof localStorage is "undefined"
      console.log "ERROR: local storage is not supported"
      return
    try
      data = JSON.parse(localStorage.getItem(key))
      value = (if data instanceof Object then data else {})
    catch e
      console.log "ERROR: invalid data is in local storage"
      value = {}
    value

  setLocalData: (key, value) ->
    if typeof localStorage is "undefined"
      console.log "ERROR: local storage is not supported"
      return
    localStorage.setItem key, JSON.stringify(value)
    value

  addToOrder: (date, data) ->
    order = @getLocalData("order")
    unless order[date]
      order[date] =
        dishes: {}
        restaurant: false
        none: false
    if data.dish and data.dish.id
      order[date].dishes[data.dish.id] = data.dish.count or 1
      order[date].restaurant = false
      order[date].none = false
    else
      if data.restaurant or data.restaurant is false
        order[date].restaurant = data.restaurant
        order[date].none = false  if data.restaurant
      if data.none or data.none is false
        order[date].none = data.none
        order[date].restaurant = false  if data.none
    @setLocalData "order", order

  removeDishFromOrder: (date, id) ->
    order = @getLocalData("order")
    delete order[date].dishes[id]  if order[date] and order[date].dishes and order[date].dishes[id]
    @setLocalData "order", order

  makeOrder: ->
    order = @getLocalData("order")
    week = {}
    success = (data) ->
      console.log "order OK", data

    error = (data) ->
      console.log "order FAIL", data

    _.each order, (data, date) ->
      data.dishes = {}  if data.restaurant or data.none
      data.none = true  if not data.restaurant and _.isEmpty(data.dishes)

    if @app and @app.menu
      _.each @app.menu.menu, (data, day) ->
        unless order[data.date]
          order[data.date] =
            dishes: {}
            restaurant: false
            none: true
    console.log "--- ORDERED", _.clone(order)
    $.ajax
      type: "POST"
      contentType: "application/json"
      url: "/api/v1/order/"
      data: JSON.stringify(order)
      success: (data) ->
        (if data.status is "ok" then success(data) else error(data))

      error: error
)
HeaderView = Backbone.View.extend(
  els: {}
  templates:
    header: _.template($("#template_header").html())
    provider: _.template($("#template_header-provider").html())

  initialize: (data) ->
    @app = data.app
    @render()

  render: ->
    $(@el).html @templates.header()
    @els.providers =
      container: $(config.selectors.header.providers)
      list: $(config.selectors.header.providerList)

    @els.days =
      items: $(config.selectors.header.day)
      titles: $(config.selectors.header.dayTitle)
      actions: $(config.selectors.header.dayActionsItem)
      comments: $(config.selectors.header.dayComment)

    @els.complete = $(config.selectors.header.completeButton)
    @app.els.page.bind "click keydown", $.proxy((event) ->
      target = $(event.target)
      condition = (event.type is "click" and not target.parents().is(config.selectors.header.day)) or (event.type is "keydown" and event.which is 27)
      condition and @hideActions()
    , this)
    @els.days.actions.click $.proxy(@hideActions, this)

  showActions: (event) ->
    $(event.target).parents(config.selectors.header.day).addClass config.classes.header.dayOpened

  hideActions: ->
    @els.days.items.removeClass config.classes.header.dayOpened

  bindDayEvents: (menu) ->
    _this = this
    itemsClick = (event) ->
      _this.hideActions()
      _this.showActions event

    titlesClick = (event) ->
      element = $(event.currentTarget)
      date = element.parents(config.selectors.header.day).data("date")
      type = element.attr("rel")
      order =
        dishes: {}
        restaurant: type is "restaurant"
        none: type is "none"

      _this.app.addToOrder date, order
      console.log "--- ACTION CLICK", date, order

    @els.days.items.addClass config.classes.header.dayInactive
    _.each menu, ((data, day) ->
      @els.days.items.filter("[rel=\"" + day + "\"]").data(date: data.date).removeClass config.classes.header.dayInactive
    ), this
    @els.days.items.not("." + config.classes.header.dayInactive).find(@els.days.titles).unbind("click", itemsClick).bind "click", itemsClick
    @els.days.items.not("." + config.classes.header.dayInactive).find(@els.days.actions).unbind("click", titlesClick).bind "click", titlesClick

  renderProviders: (menu, day, provider) ->
    @els.providers.container.removeClass config.classes.header.providersInactive
    @els.providers.list.empty()
    _.each menu[day].providers, $.proxy((dishes, provider) ->
      @els.providers.list.append @templates.provider(
        name: provider
        day: day
      )
    , this)
    @els.providers.items = $(config.selectors.header.provider)
    @els.providers.names = $(config.selectors.header.providerName)
    @els.providers.items.removeClass(config.classes.header.providerActive).filter("[rel=\"" + provider + "\"]").addClass config.classes.header.providerActive

  disableProviders: ->
    @els.providers.container.addClass config.classes.header.providersInactive
    @els.providers.items.removeClass config.classes.header.providerActive
    @els.providers.names.removeAttr "href"

  toggleDay: (day) ->
    @els.days.items.removeClass(config.classes.header.dayActive).filter("[rel=\"" + day + "\"]").addClass config.classes.header.dayActive
)
MenuView = Backbone.View.extend(
  els: {}
  templates:
    group: _.template($("#template_menu-group").html())
    item: _.template($("#template_menu-item").html())
    overlay:
      common: _.template($("#template_overlay").html())
      attention: _.template($("#template_overlay-attention").html())

  initialize: (data) ->
    console.log "MENU view init", data, @el, data.app, data.app.els.page
    @el = $(@el)
    @app = data.app
    @getData @render

  getData: (callback) ->
    menu = @model.get("objects")
    localOrder = @app.getLocalData("order")
    order = undefined
    setData = ->
      return  if not menu or not order
      @menu = @assembleMenu(menu.get("objects"))
      @app.order = model: order  if @app and not @app.order
      if not localOrder or _.isEmpty(localOrder)
        _.each order, (data, date) ->
          dayOrder = {}
          dayDishes = {}
          _.each data.dishes, (categories, provider) ->
            _.each categories, (dishes, category) ->
              _.each dishes, (dish) ->
                dayDishes[dish.id] = dish.count

          dayOrder =
            dishes: (if (data.restaurant or data.none) then {} else dayDishes)
            restaurant: data.restaurant
            none: data.none

          dayOrder.none = true  if not dayOrder.none and _.isEmpty(dayDishes)
          localOrder[date] = dayOrder

        console.log "--- NEW LOCAL ORDER: MenuView", _.clone(localOrder)
        @app.setLocalData "order", localOrder
      @app.header.bindDayEvents @menu
      callback.call this

    unless menu
      @app.fetchModel @model, ((model) ->
        menu = model
        setData.call this
      ), this
    @app.fetchModel new OrderModel(), ((model) ->
      order = model.get("objects")[0]
      setData.call this
    ), this
    setData.call this

  assembleMenu: (objects, order) ->
    weekMenu = {}
    categoriesOrder =
      primary: 0
      secondary: 1
      snack: 2
      dessert: 3
      misc: 4

    _.each objects, (day) ->
      weekday = config.text.daysRu2En[$.trimAll(day.weekday)]
      dayMenu = weekMenu[weekday] =
        providers: {}
        date: day.date

      _.each day.providers, (categories, provider) ->
        providerMenu = dayMenu.providers[provider] = {}
        _.each categories, (dishes, category) ->
          categoryName = config.text.categoriesRu2En[$.trimAll(category)]
          categoryMenu = providerMenu[categoryName] =
            name: config.text.categoriesEn2Ru[categoryName]
            order: categoriesOrder[categoryName]
            dishes: dishes

    weekMenu

  correctOptions: (options) ->
    menu = @menu
    order = [ "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" ]
    defaults =
      day: options.day or "monday"
      provider: options.provider or ""

    check = ->
      if menu[defaults.day] and menu[defaults.day].providers[defaults.provider]
        return
      else
        if menu[defaults.day]
          unless menu[defaults.day].providers[defaults.provider]
            for provider of menu[defaults.day].providers
              defaults.provider = provider
              break
        else
          i = 0
          l = order.length

          while i < l
            if menu[order[i]]
              defaults.day = order[i]
              break
            i++
        check()

    check()
    defaults

  getMenuHTML: (menu, order, options) ->
    menuArr = []
    menuHTML = []
    _.each menu[options.day].providers[options.provider], (item) ->
      menuArr.push item

    menuArr.sort (a, b) ->
      (if a.order < b.order then -1 else 1)

    _.each menuArr, ((items) ->
      groupHTML = []
      _.each items.dishes, ((dish) ->
        if not _.isEmpty(order) and order[options.date] and order[options.date].dishes[dish.id]
          dish.isSelected = @order[options.date].dishes[dish.id]
          dish.count = @order[options.date].dishes[dish.id]
        groupHTML.push @templates.item(dish)
      ), this
      menuHTML.push @templates.group(
        name: items.name
        order: items.order
        items: groupHTML.join("")
      )
    ), this
    menuHTML.join ""

  render: (params) ->
    console.log "MENU view render:", @menu, @app.order.model.attributes, @el, _.clone(@app.options), _.clone(params)
    return  if not @menu or _.isEmpty(@menu)
    _.each @app.getLocalData("order"), ((data, date) ->
      type = (if data.restaurant then "restaurant" else (if data.none then "none" else "office"))
      @setHeaderDayText date,
        type: type
    ), this
    currentOptions = (if params and params.options then params.options else (if @app and @app.options then @app.options else {}))
    options =
      day: currentOptions.day or @app.els.content.data("menu-day")
      provider: currentOptions.provider or @app.els.content.data("menu-provider")

    corrected = @correctOptions(options)
    isDayCorrect = options.day and options.day is corrected.day
    isProviderCorrect = options.provider and options.provider is corrected.provider
    options.day = corrected.day  unless isDayCorrect
    options.provider = corrected.provider  unless isProviderCorrect
    if (not isDayCorrect or not isProviderCorrect or not currentOptions.day or not currentOptions.provider) and not currentOptions.overlayType
      console.log "options INCORRECT:", options.day, options.provider, "\n\n"
      document.location.hash = "#/menu/" + options.day + "/" + options.provider + "/"
      return
    else
      console.log "options CORRECT:", options.day, options.provider, "\n\n"
    options.date = @menu[options.day].date
    @app.header.renderProviders @menu, options.day, options.provider
    @app.header.toggleDay options.day
    @el.data "menu-day": options.day
    @el.data "menu-date": options.date
    @el.data "menu-provider": options.provider
    @app.resetPage()
    @el.empty().append(@getMenuHTML(@menu, @order, options)).hide().fadeIn()
    if currentOptions.overlayType
      @renderOverlay
        date: options.date
        day: options.day
        overlayType: currentOptions.overlayType
    setTimeout $.proxy(->
      @setSelectedDishes.call this, options.date, options.day
      @bindEventsForOrder.call this, options.date
    , this), 0

  setSelectedDishes: (date, day) ->
    order = @app.getLocalData("order")
    return  if _.isEmpty(order[date])
    if order[date].restaurant or order[date].none
      type = (if order[date].restaurant then "restaurant" else (if order[date].none then "none" else ""))
      console.log "--- set selected dishes 1: render overlay", order[date].restaurant, order[date].none
      @renderOverlay
        date: date
        day: day
        overlayType: type

      @setHeaderDayText date,
        type: type
    else
      @els.item = $(config.selectors.menu.item.container)
      if order[date] and order[date].dishes
        console.log "--- set selected dishes 2: local data", order[date].dishes
        _.each order[date].dishes, ((count, id) ->
          element = @els.item.filter("[data-id=" + id + "]")
          return  unless element.length
          element.addClass(config.classes.menu.selected).find(config.selectors.menu.item.number).html count
          count > 1 and element.find(config.selectors.menu.item.count).removeClass(config.classes.menu.countOne)
        ), this
      else if order[date] and order[date].providers
        console.log "--- set selected dishes 3: DB data", order[date].providers
        _.each order[date].providers, ((categories, provider) ->
          _.each categories, ((dishes, category) ->
            _.each dishes, ((dish) ->
              element = @els.item.filter("[data-id=" + dish.id + "]")
              return  unless element.length
              element.addClass(config.classes.menu.selected).find(config.selectors.menu.item.number).html dish.count
              dish.count > 1 and element.find(config.selectors.menu.item.count).removeClass(config.classes.menu.countOne)
            ), this
          ), this
        ), this
      @setHeaderDayText date,
        type: "office"

  bindEventsForOrder: (date) ->
    @els.item = $(config.selectors.menu.item.container)
    @els.plus = $(config.selectors.menu.item.plus)
    @els.minus = $(config.selectors.menu.item.minus)
    @els.countControls = @els.plus.add(@els.minus)
    @els.item.click $.proxy((event) ->
      selected = config.classes.menu.selected
      element = $(event.currentTarget)
      id = element.data("id")
      target = $(event.target)
      number = element.find(config.selectors.menu.item.number)
      return  if target.is(number)
      if element.hasClass(selected)
        @app.removeDishFromOrder date, id
        element.removeClass selected
      else
        @app.addToOrder date,
          dish:
            id: id
            count: 1

        element.addClass selected
      @setHeaderDayText date,
        type: "office"
    , this)
    @els.countControls.click $.proxy((event) ->
      els = {}
      count = {}
      id = undefined
      els.button = $(event.currentTarget)
      els.container = els.button.parents(config.selectors.menu.item.container)
      els.count = els.container.find(config.selectors.menu.item.count)
      els.number = els.count.find(config.selectors.menu.item.number)
      id = els.container.data("id")
      count.original = +els.number.html() or 1
      count.increment = (if count.original < 9 then count.original + 1 else 9)
      count.decrement = (if count.original > 1 then count.original - 1 else 1)
      count.changed = (if els.button.is(config.selectors.menu.item.plus) then count.increment else count.decrement)
      @app.addToOrder date,
        dish:
          id: id
          count: count.changed

      (if count.changed > 1 then els.count.removeClass(config.classes.menu.countOne) else els.count.addClass(config.classes.menu.countOne))
      els.number.html count.changed
      @setHeaderDayText date,
        type: "office"

      event.stopPropagation()
    , this)

  renderOverlay: (options) ->
    content = undefined
    template = @templates.overlay.common
    text =
      start:
        message: "Начните "
        days: config.text.daysEn2RuInflect2

      none:
        message: "Худею "
        link:
          href: "http://ru.wikipedia.org/wiki/Диета"
          text: "Худейте правильно!"

        days: config.text.daysEn2RuInflect1

      restaurant:
        message: "Луч гламура "
        link:
          href: "http://goo.gl/KU6eY"
          text: "Где это клёвое место?"

        days: config.text.daysEn2RuInflect1

      attention:
        message: "Ахтунг!"

    if not options.overlayType or not options.day
      alert "overlay error: " + options.overlayType + " -- " + options.day
      return
    if options.overlayType is "restaurant" or options.overlayType is "none"
      dayOrderData = {}
      dayOrderData[options.overlayType] = true
      @app.addToOrder options.date, dayOrderData
      @setHeaderDayText options.date,
        type: options.overlayType
    content =
      className: config.classes.overlay[options.overlayType][(if options.day is "week" then "week" else "day")]
      message: text[options.overlayType].message + text[options.overlayType].days[options.day]
      link:
        href: text[options.overlayType].link.href
        text: text[options.overlayType].link.text

    if options.overlayType is "attention"
      template = @templates.overlay.attention
      content =
        className: config.classes.overlay.attention
        message: text.attention.message
    @app.header.disableProviders()
    @el.find(config.selectors.overlay).remove().end().append template(content)

  getDayOrderPrice: (date) ->
    order = @app.getLocalData("order")[date]
    price = 0
    dayMenu = undefined
    return 0  unless order
    _.each @menu, (data, day) ->
      dayMenu = data  if date is data.date

    _.each dayMenu.providers, (categories, provider) ->
      _.each categories, (categoryData, category) ->
        _.each categoryData.dishes, (dish) ->
          price += (+dish.price * order.dishes[dish.id])  if order.dishes[dish.id]

    price

  setHeaderDayText: (date, options) ->
    text =
      office: "в офисе"
      restaurant: "в Луч"
      none: "худею"

    element = undefined
    price = undefined
    @app.header.els.days.items.each (i, e) ->
      day = $(e)
      element = day  if day.data("date") is date

    element.removeClass(config.classes.header.dayCompleted).removeClass(config.classes.header.dayHasPrice).find(@app.header.els.days.comments).html ""
    if options.type is "office"
      price = @getDayOrderPrice(date)
      text.office += " / " + price + "р."
      element.addClass config.classes.header.dayHasPrice
      element.find(config.selectors.header.dayPriceBig).html price
    element.addClass(config.classes.header.dayCompleted).find(@app.header.els.days.comments).html text[options.type]  if options.type isnt "office" or (options.type is "office" and price)
)
OrderView = Backbone.View.extend(
  els: {}
  templates:
    dishes: _.template($("#template_order-group-dishes").html())
    message: _.template($("#template_order-group-message").html())
    item: _.template($("#template_menu-item").html())

  initialize: (data) ->
    console.log "ORDER view initialize", arguments
    @el = $(@el)
    @app = data.app
    @getData @render

  getData: (callback) ->
    order = undefined
    localOrder = @app.getLocalData("order")
    menu = (if @app and @app.menu then @app.menu.model else null)
    setData = ->
      console.log "--- SET DATA", order, menu
      return  if not menu or not order
      console.warn "order view:", (if localOrder and not _.isEmpty(localOrder) then "local" else "server"), localOrder, order
      @order = @assembleOrder((if localOrder and not _.isEmpty(localOrder) then localOrder else order), menu.get("objects"))
      @app.menu = model: menu  if @app and not @app.menu
      if not localOrder or _.isEmpty(localOrder)
        _.each order, (data, date) ->
          dayOrder = {}
          dayDishes = {}
          _.each data.dishes, (categories, provider) ->
            _.each categories, (dishes, category) ->
              _.each dishes, (dish) ->
                dayDishes[dish.id] = dish.count

          dayOrder =
            dishes: (if (data.restaurant or data.none) then {} else dayDishes)
            restaurant: data.restaurant
            none: data.none

          dayOrder.none = true  if not dayOrder.none and _.isEmpty(dayDishes)
          localOrder[date] = dayOrder

        console.log "--- NEW LOCAL ORDER: OrderView", _.clone(localOrder)
        @app.setLocalData "order", localOrder
      callback.call this

    @app.fetchModel @model, ((model) ->
      order = model.get("objects")[0]
      setData.call this
    ), this
    unless menu
      @app.fetchModel new MenuModel(), ((model) ->
        menu = model
        setData.call this
      ), this
    setData.call this

  assembleOrder: (objects, menu) ->
    console.log "--- ASSEMBLE ORDER", objects, menu
    days = {}
    sorted = []
    _.each menu, (data) ->
      date = data.date
      order = objects[date]
      days[date] =
        date: date
        weekday: data.weekday
        weekdayEn: config.text.daysRu2En[$.trimAll(data.weekday)]
        dishes: []
        restaurant: false
        none: true

      if order
        days[date].restaurant = order.restaurant
        days[date].none = order.none
        if order and not order.restaurant and not order.none
          if order.weekday
            _.each order.dishes, (categories, provider) ->
              _.each categories, (dishes, category) ->
                _.each dishes, (dish) ->
                  days[data.date].dishes.push
                    name: dish.name
                    count: dish.count
                    price: dish.price
                    id: dish.id
                    provider: provider
                    category: config.text.categoriesEn2Ru[config.text.categoriesRu2En[$.trimAll(category)]]

            console.log "--- ORDER FROM SERVER"
          else
            _.each data.providers, (categories, provider) ->
              _.each categories, (dishes, category) ->
                _.each dishes, (dish) ->
                  if order.dishes[dish.id]
                    days[data.date].dishes.push
                      name: dish.name
                      count: dish.count
                      price: dish.price
                      id: dish.id
                      provider: provider
                      category: config.text.categoriesEn2Ru[config.text.categoriesRu2En[$.trimAll(category)]]

            console.log "--- ORDER FROM LOCAL STORAGE"

    console.log "--- DAYS", _.clone(days)
    _.each days, (data) ->
      sorted.push data

    sorted.sort (a, b) ->
      str =
        a: a.date.split("-")
        b: b.date.split("-")

      date =
        a: new Date(+str.a[0], +str.a[1] - 1, +str.a[2])
        b: new Date(+str.b[0], +str.b[1] - 1, +str.b[2])

      (if +date.a < +date.b then -1 else 1)

    sorted

  render: ->
    console.log "ORDER view render", @order
    return  if not @order or not @order.length
    orderHTML = []
    _.each @order, ((data) ->
      dayHTML = []
      dayPrice = 0
      hasDishes = not data.restaurant and not data.none
      template = undefined
      content = undefined
      _.each data.dishes, ((dish) ->
        dayHTML.push @templates.item(dish)
        dayPrice += +dish.price
      ), this
      if hasDishes
        template = @templates.dishes
        content =
          date: data.date
          day: data.weekday.capitalize()
          price: dayPrice
          dishes: dayHTML.join("")
      else
        className = (if data.restaurant then config.classes.order.restaurant else (if data.none then config.classes.order.none else ""))
        message = (if data.restaurant then "Луч гламура " else (if data.none then "Худею " else ""))
        template = @templates.message
        content =
          date: data.date
          day: data.weekday.capitalize()
          message: message + config.text.daysEn2RuInflect1[data.weekdayEn]
          className: className
      orderHTML.push template(content)
    ), this
    @app.resetPage()
    @app.makeOrder()
    @app.setLocalData "order", null
    @el.empty().addClass(config.classes.content.order).html(orderHTML.join("")).hide().fadeIn()
    @app.els.page.addClass config.classes.page.order
)
FavouritesView = Backbone.View.extend(
  els: {}
  templates:
    container: _.template($("#template_favourites").html())
    category: _.template($("#template_favourites-category").html())
    item: _.template($("#template_favourites-item").html())

  initialize: (data) ->
    console.log "FAVOURITES view initialize", @model, @model.get("objects")
    @app = data.app
    @el = $(@el)
    @getData @render

  getData: (callback) ->
    favourites = @model.get("objects")
    if not favourites or not favourites.length
      @app.fetchModel @model, ((model) ->
        @favourites = @assertFavourites(model.get("objects"))
        callback.call this
      ), this

  assertFavourites: (objects) ->
    favourites = {}
    _.each objects, (dish) ->
      category = config.text.categoriesRu2En[dish.group]
      unless favourites[category]
        favourites[category] =
          name: config.text.categoriesEn2RuShort[category]
          dishes: []
      favourites[category].dishes.push dish

    favourites

  render: ->
    console.log "FAVOURITES view render:", @favourites
    return  unless @favourites
    favourites = []
    _.each @favourites, ((data, categoryName) ->
      category = []
      _.each data.dishes, ((dish) ->
        category.push @templates.item(
          name: dish.name
          provider: dish.provider
          id: dish.id
          isSelected: dish.favorite
        )
      ), this
      favourites.push @templates.category(
        name: data.name
        category: categoryName
        items: category.join("")
      )
    ), this
    @app.resetPage()
    @el.empty().addClass(config.classes.content.favourites).append(@templates.container(categories: favourites.join(""))).hide().fadeIn()
    @app.els.page.addClass config.classes.page.favourites
    setTimeout $.proxy(@bindEvents, this), 0

  bindEvents: ->
    $(".content__favourites-category").eq(0).addClass "m-small"
    $(".content__favourites-category").eq(4).addClass "m-small"
    changed = false
    timer = undefined
    @els.item = $(config.selectors.favourites.item)
    @els.item.click $.proxy((event) ->
      element = $(event.currentTarget)
      id = element.data("id")
      selected = element.hasClass(config.classes.favourites.selected)
      (if selected then element.removeClass(config.classes.favourites.selected) else element.addClass(config.classes.favourites.selected))
      changed = true
    , this)
    timer = setInterval($.proxy(->
      if changed
        changed = false
        @saveFavourites()
    , this), 1000)
    $(window).one "hashchange beforeunload", $.proxy(->
      clearInterval timer
      changed and @saveFavourites()
    , this)

  saveFavourites: ->
    favourites = []
    success = (data) ->
      console.log "favourites OK", data

    error = (data) ->
      console.log "favourites FAIL", data

    @els.item.filter("." + config.classes.favourites.selected).each (i, element) ->
      favourites.push $(element).data("id")

    console.log "FAVOURITES SAVE", favourites.slice()
    $.ajax
      type: "POST"
      contentType: "application/json"
      url: "/api/v1/favorite/"
      data: JSON.stringify(objects: favourites)
      success: (data) ->
        (if data.status is "ok" then success(data) else error(data))

      error: error
)