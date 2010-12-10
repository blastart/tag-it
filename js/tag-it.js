

(function($) {

    /*
     *  @author Levy Carneiro Jr.
     *          web: http://levycarneiro.com
     *          git: https://github.com/levycarneiro/tag-it
     *
     *  Modified by Imre Ardelean at blastart@gmail.com
     *          git: https://github.com/blastart/tag-it/blob/master/js/tag-it.js
     *  New futures:
     *          - Object independent. From now, you can use this plugin several times within the same page.
     *
     *          -  new events:
     *                  - options.removeEvent = function(event, removed_tag_title){ };
     *                  - options.addEvent = function(event, new_tag_title){ };
     *          -  new triggers:
     *                  - $('ul.your_tagit').trigger('newtag', ['new tag name'])  -> add new tag
     *                  - $('ul.your_tagit').trigger('newtags', [[array of new tags]]) -> add multiple tags
     *                          (In this case, the removeEvent() event is not fired.)
     *                  - $('ul.your_tagit').trigger('remove_all') -> flush all tags (removeEvent() will not be fired)
    */

    $.fn.tagit = function(options) {
        return this.each(function(i) {

            var $ul = $(this).addClass("tagit"),
                $input_field = $('<li class="tagit-new"></li>'),
                $input = $('<input class="tagit-input" type="text" />'),

                BACKSPACE = 8,
                ENTER = 13,
                SPACE = 32,
                COMMA = 44
            ;
            $input_field.append($input);
            $ul.html($input_field);
            $ul.data('$tag_input', $input);
            $input.data('$ul', $ul);

            $ul.click(function(e){
                    var $ul = $(this);
                    if (e.target.tagName == 'A') {
                            // Removes a tag when the little 'x' is clicked.
                            // Event is binded to the UL, otherwise a new tag (LI > A) wouldn't have this event attached to it.
                            $ul.trigger('event_removed', [$(e.target).next().val()]);
                            $(e.target).parent().remove();
                    }
                    else {
                            // Sets the focus() to the input field, if the user clicks anywhere inside the UL.
                            // This is needed because the input field needs to be of a small size.
                             $ul.data('$tag_input').focus();
                    }
            });

            $input.keypress(function(event){
                    var $input = $(this);
                    if (event.which == BACKSPACE) {
                            if ($input.val() == "") {
                                    // When backspace is pressed, the last tag is deleted.
                                    var $last = $input.data('$ul').children(".tagit-choice:last");
                                    $input.data('$ul').trigger('event_removed', [$last.find('input').val()]);
                                    $last.remove();
                            }
                    }
                    // Comma/Space/Enter are all valid delimiters for new tags.
                    else if (event.which == COMMA || event.which == SPACE || event.which == ENTER) {
                            event.preventDefault();

                            var typed = $input.val();
                            typed = typed.replace(/,+$/,"");
                            typed = $.trim(typed);

                            if (typed != "") {
                                    if (is_new (typed, $input)) {
                                            create_choice (typed, true, $input);
                                    }
                                    // Cleaning the input.
                                    $input.val("");
                            }
                    }
            }).autocomplete({
                source: function (request, response) {
                    $.ajax({
                        url: options.availableTags,
                        type: "POST",
                        dataType: "json",
                        data: {
                             term: request.term
                        },
                        success: response
                    });
                },
                select: function(event,ui){
                    var $input = $(this);

                    if (is_new(ui.item.value, $input) && ui.item.value != "") {
                            create_choice (ui.item.value, true, $input);
                    }
                    // Cleaning the input.
                    $input.val("");

                    return false;
                }
            });

            $ul.bind('newtag', function(e, tag){
                var $ul = $(this);
                if ( is_new(tag, $ul.data('$tag_input')) ) {
                        create_choice(tag, true, $ul.data('$tag_input'));
                }

            }).bind('newtags', function(e, tags) {
                var $ul = $(this);
                for (tag in tags) {
                    if ( is_new(tags[tag], $ul.data('$tag_input')) ) {
                            create_choice(tags[tag], false, $ul.data('$tag_input'));
                    }

                }

            }).bind('remove_all', function(e){

                $(this).find('.tagit-choice').remove();

            }).bind('update_data', function(e){
                var tags = [];
                $(this).find('.tagit-choice input').each(function(e) {
                    tags.push($.trim($(this).val()))
                });

                $(this).data('tags',tags);
            });

            if (typeof options.removeEvent == "function") {
                $ul.bind('event_removed',options.removeEvent);
            }
            if (typeof options.addEvent == "function") {
                $ul.bind('event_added',options.addEvent);
            }

            function is_new (value, $input){
                    var is_new = true;
                    $input.parent().parent().children(".tagit-choice").each(function(i){
                            if (value == $(this).children("input").val()) {
                                    is_new = false;
                            }
                    });
                    return is_new;
            }
            function create_choice (value, trigger_event, $input){

                    var ds = ((typeof trigger_event == "boolean") ? trigger_event : true)
                        $ul = $input.data('$ul'),
                        new_el  =
                        '<li class="tagit-choice">'+ value + '<a class="close">x</a>'+
                            '<input type="hidden" style="display:none;" value="'+ value +'" name="item[tags][]">'+
                        '</li>'
                    ;

                    $(new_el).insertBefore($input.parent());
                    $input.val("");
                    if (ds) { $ul.trigger('event_added', [value]); }
            }

        });
    };


})(jQuery);