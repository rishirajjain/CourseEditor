$(function () {
  var dragElements = [];
  //Add all existing sections to the dragSections array
  $.each(sections, function(key, value){
    var dragItem = new DraggableHandledItemWidget( {
      data: value,
      icon: 'menu',
      label: value
    } );
    dragItem.$label.append("<i class='fa fa-trash fa-lg deleteElementIcon pull-right'></i>",
    "<i class='fa fa-pencil editElementIcon fa-lg pull-right'></i>");
    dragElements.push(dragItem);
  });

  //Create a draggableWidget with the items in the dragSections array
  var draggableWidget = new DraggableGroupWidget( {
    items: dragElements
  } );
  var fieldDrag = new OO.ui.FieldLayout(draggableWidget);

  //Create a textInputWidget for new sections
  var textInputWidget = new OO.ui.TextInputWidget( { placeholder: OO.ui.deferMsg( 'courseeditor-add-new-section' ) } );
  var fieldInput = 	new OO.ui.FieldLayout( textInputWidget);

  //Create save button
  var buttonSave = new OO.ui.ButtonWidget( {
    id: 'saveCourse',
    label: OO.ui.deferMsg( 'courseeditor-save-course' ),
    flags: ['constructive'],
  } );
  buttonSave.$label.append("<i class='fa fa-floppy-o pull-left' aria-hidden='true'></i>");

  //Append all created elements to DOM
  $('#sectionsList').append(fieldDrag.$element, fieldInput.$element);
  $('#saveDiv').append('<br><br>', buttonSave.$element);

  initHandlers(draggableWidget, textInputWidget, editStack);

  $('#saveCourse').click(function(){
    var newSections = [];
    $.each(draggableWidget.getItems(), function(key, value){
      newSections.push(value.data);
    });
    editStack.push({
      action: 'update',
      elementsList: JSON.stringify(newSections)
    });

    var progressDialog = new ProgressDialog( {
      size: 'medium'
    } );
    windowManager.addWindows( [ progressDialog ] );
    windowManager.openWindow( progressDialog );

    var createTask = function(operation){
      return function(next){
        doTask(operation, next);
      }
    };

    var doTask = function(operation, next){
      $.getJSON( mw.util.wikiScript(), {
        action: 'ajax',
        rs: 'CourseEditorOperations::applyCourseOp',
        rsargs: [$('#courseName').text(), JSON.stringify(operation)]
      }, function ( data ) {
        //FIXME add error handlers
        next();
      });
    }

    while( editStack.length > 0 ) {
      var operation =  editStack.shift();
      $(document).queue('tasks', createTask(operation));
    };

    $(document).queue('tasks', function(){
      windowManager.closeWindow([progressDialog]);
      window.location.assign('/' +  $('#courseName').text());
    });

    dequeue('tasks');
  });
})
