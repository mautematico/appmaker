/**
 * MoveHandle changes the (x, y) coordinates of selected Scraps 
 */
Design.MoveHandle = function () {
}

Design.MoveHandle.create = function (scrap) {
  
  var element = scrap.element()
  
  
  var div = $('<div></div>')
  div.attr('value', scrap.getPath())
  div.addClass('handle ' + scrap.id + '_handle move_handle')
  div.attr('id', 'move_handle_' + scrap.id)
  div.attr('title', scrap.id)
  
  var position = element.css('position')
  if (position === 'fixed' || position === 'absolute') {
    div.on("mousedown", Design.MoveHandle.mousedown)
    div.on("slide", Design.MoveHandle.slide)
    div.on("slidestart", Design.MoveHandle.slidestart)
    div.on("slideend", Design.MoveHandle.slideend)
    div.css('cursor', 'move')
  }
  div.css({
    "position" : (position === 'fixed' ? 'fixed' : 'absolute'),
    "z-index" : "50"
  })
  element.parent().append(div)
  div.on("tap", Design.MoveHandle.tap)
  div.on("update", Design.MoveHandle.update)
  div.on("dblclick", function (event) {
    if (event.metaKey) {
      element.togglePosition()
      Design.stage.commit()
      element.deselect().selectMe()
    } else
      scrap.edit(true)
  })
  
  div.trigger("update")
}

// We cache the start dimensions
Design.MoveHandle.dimensions = {}

//If small block is on top of (higher z-index) a bigger block, selects small block
Design.MoveHandle.mousedown = function () {
//  Design.MoveHandle.selectTopScrap()
  Design.MoveHandle.dimensions = $(this).owner().dimensions()
  Design.grid.create()
  Design.MoveHandle.last_x_change = 0
  Design.MoveHandle.last_y_change = 0
  
  Design.MoveHandle.scrollTop = Design.stage.scrollTop()
  return true
}

/**
 * if the click is on another smaller div select that one instead of move.
 *
 * @param true. Allow propogation
 */
Design.MoveHandle.selectTopScrap = function () {

  // get element at point
  var offsetLeft = $('#DesignStageBody').offset().left
  var offsetTop = $('#DesignStageBody').offset().top
  var element = $.topDiv('.scrap:visible', Design.Mouse.down.pageX - offsetLeft, Design.Mouse.down.pageY - offsetTop + Design.stage.scrollTop())
  // if a narrow div and no element underneath, return
  if (!element)
    return true
  // Its the selection block
  if (element.hasClass("selection"))
    return true
  var scrap = element.scrap()
  // Dont select block if locked
  if (scrap.get('locked'))
    return true
  Design.stage.selection.clear()
  element.selectMe()
  return true
}

/**
 * Changes top and/or left and/or bottom and/or right and/or margin
 */
Design.MoveHandle.slide = function (event, mouseEvent) {

  var owner = $(this).owner()
  var scrap = owner.scrap()
  var dimensions = Design.MoveHandle.dimensions
  
  var scrollChange = Design.stage.scrollTop() - Design.MoveHandle.scrollTop

  var grid_change = {y : 0, x : 0}

  if (!mouseEvent.shiftKey) {
    grid_change = Design.grid.getDelta([
      {x : dimensions.left + Design.Mouse.xChange, y : dimensions.top + Design.Mouse.yChange + scrollChange},
      {x : dimensions.right + Design.Mouse.xChange, y : dimensions.bottom + Design.Mouse.yChange + scrollChange},
      {x :  dimensions.center + Design.Mouse.xChange, y : dimensions.middle + Design.Mouse.yChange + scrollChange}
    ])
  }
  var y_change = Design.Mouse.yChange + scrollChange + grid_change.y
  var x_change = Design.Mouse.xChange + grid_change.x
  

  $('.selection').each(function (){
    $(this).scrap().move(x_change - Design.MoveHandle.last_x_change, y_change - Design.MoveHandle.last_y_change)
  })
  
  var position = 'X ' + parseFloat(owner.css('left')) + '<br>Y ' + parseFloat(owner.css('top'))
  $('#DesignDimensions').css({
    left : 10 + owner.offset().left + owner.outerWidth(),
    top : -10 + owner.offset().top + Math.round(owner.outerHeight(true)/2)
    }).html(position)
  
  Design.MoveHandle.last_x_change = x_change
  Design.MoveHandle.last_y_change = y_change
  
  return false
  
}

Design.MoveHandle.slideend = function () {
  
  $('.handle').trigger('update').show()
  Design.grid.removeSnaplines()
  $('#DesignDimensions').hide()
  Design.stage.commit()
}

Design.MoveHandle.slidestart = function () {
  
  $('.handle').not(this).hide()
  var owner = $(this).owner()
  var position = 'X ' + parseFloat(owner.css('left')) + '<br>Y ' + parseFloat(owner.css('top'))
  $('#DesignDimensions').css({
    left : 10 + owner.offset().left + owner.outerWidth(),
    top : -10 + owner.offset().top + Math.round(owner.outerHeight(true)/2)
    }).html(position).show()
  return false
}

// Dont propogate tap events
Design.MoveHandle.tap = function () {
  // If shift key is down, remove from selection
  if (Design.Mouse.down && Design.Mouse.down.shiftKey)
    $(this).owner().deselect()
  return false
}

Design.MoveHandle.update = function () {
  var owner = $(this).owner()
  if (!owner.position())
    debugger
  // make it easy to move narrow divs
  var top_padding  = Math.min(10, owner.outerHeight(true) - 20)
  var left_padding = Math.min(10, owner.outerWidth() - 20)
  var style = {
    "left" : owner.position().left + left_padding  + 'px',
    "top" : (owner.position().top + top_padding) + 'px',
    "height" : (owner.outerHeight(true) - top_padding * 2) + 'px',
    "width" : (owner.outerWidth() - left_padding * 2)  + 'px'}
  $(this).css(style)
}
