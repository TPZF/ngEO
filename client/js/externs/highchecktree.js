/**
 *name: jquery.highCheckTree
 *author: yan, xuekai
 *version: 0.2.1
*/

/**input data format: 

[{
    item:{id:'id', label:'label', checked:false}, 
    chidren:[{
        item:{id:'id', label:'label', checked:false}, 
        chidren:[...]
    }]
}, ....]

*/

(function($){
    
    jQuery.fn.highCheckTree = function(settings){
        
        settings = $.extend({
            data:[],               // input data which will be used to initilze the tree
            onExpand: null,        // an event will be triggered when the tree node was expanded
            onCollapse: null,      // an event will be triigered when the tree node was collapsed
            onPreCheck: null,      // an event will be triggered before the tree node was checked
            onCheck: null,         // an event will be triggered when the tree node was checked
            onUnCheck: null,       // an event will be triggered when the tree node was unchecked
            onLabelHoverOver: null,// an event will be triggered when mouse hover over the label
            onLabelHoverOut: null,  // an event will be triggered when mouse hover out the label
            onAddLi: null,           // an event will be triggered when li is added
            onDeleteLi: null,       // an event will be triggered when li must be deleted
            options: {}             // Option checkboxes buttons
        }, settings);

        var container = $(this), $tree = this;

        //get children html tag string
        function getChildrenHtml(treesdata, result){
            var len = treesdata.length, clen, arrowClass, checkedClass = '',
                        checkedChildren;
            $.each(treesdata, function(index, node) {//for(i = 0; i < len; i++){
               
                $.data($tree, node.item.id, node); //attach node data to node id
                clen = node.children ? node.children.length : 0;
                arrowClass = 'collapsed';
                if(clen === 0){
                    arrowClass = 'nochildren';
                    checkClass = node.item.checked ? 'checked' : '';
                }else{
                    var checkedChildren = $.grep(node.children, function(el){
                        return el.item.checked;
                    });
                    checkClass = checkedChildren.length === 0 ? '' : checkedChildren.length === clen ? 'checked' : 'half_checked'; 
                }

                var liContent = '<li rel="' + node.item.id + '">\
                                    <div class="arrow ' + arrowClass + '"></div>\
                                    <div id="baseCheckbox" class="checkbox ' + checkClass + '"></div>\
                                    <label>' + node.item.label + '</label>\
                                    <div style="display: none;" class="delete"></div>\
                                    <div style="position: absolute; left: 500px;" class="options"></div>\
                                </li>';

                var $li = $(liContent).appendTo(result);

                var $options = $li.find(".options");
                for ( var x in settings.options ) {
                    var optionCallback = settings.options[x];
                    // var flip = '<select class="optionCheckbox" style="display: none;" name="flip-mini" style="width: 10em;" id="flip-mini" data-role="slider" data-mini="true">\
                    //     <option value="off">Overlay</option>\
                    //     <option value="on">Background</option>\
                    // </select>';
                    //$(flip).appendTo($options)
                    $('<div style="display:none;" class="checkbox optionCheckbox"></div>').appendTo($options)
                        .on('selectchange', function(event) {
                            optionCallback($li, $(this).hasClass('checked'));
                        });

                }

                if ( settings.onAddLi ) {
                    settings.onAddLi( $li, node );
                }
            });
        }

        //display children node with data source
        function updateChildrenNodes($li, data, isExpanded) {
            if(data.children && data.children.length>0){
              var $innerHtml = isExpanded ? $('<ul>') : $('<ul style="display:none;">');
                getChildrenHtml(data.children, $innerHtml);
                $li.append($innerHtml);
            }
            
            $li.addClass('updated');
        }

        //initialize the check tree with the input data
        (function initalCheckTree() {
            var $treesHtml = $('<ul style="position: relative" class="checktree">');
            getChildrenHtml(settings.data, $treesHtml);
            container.empty().append($treesHtml);
        })();
        
         //bind select change to checkbox
        container.off('selectchange', '#baseCheckbox').on('selectchange', '#baseCheckbox', function () {
            var $li = $(this).closest("li");
            if (settings.onPreCheck) {
                if (!settings.onPreCheck($li)) {
                    return;
                }
            }

            var dataSource = $.data($tree, $li.attr('rel'));
            var $all = $(this).siblings('ul').find('#baseCheckbox');
            var $checked = $all.filter('.checked');

            //all children checked
            if ($all.length === $checked.length) {
                $(this).removeClass('half_checked').addClass('checked');
                dataSource.item.checked = true;
                if (settings.onCheck) {
                    settings.onCheck($li);
                }
            //all children are unchecked
            } else if ($checked.length === 0) {
                dataSource.item.checked = false;
                $(this).removeClass('checked').removeClass('half_checked');
                if (settings.onUnCheck) {
                    settings.onUnCheck($li);
                }
            //some children are checked
            } else {
                dataSource.item.checked = false;
                if (settings.onHalfCheck && !$(this).hasClass('half_checked')) {
                    settings.onHalfCheck($li);
                }

                $(this).removeClass('checked').addClass('half_checked');
            }
        });
        


        container.off('mouseover', 'li').on('mouseover', 'li', function(event) {

            if ( $(event.target).is('label') ) {
                return;
            }

            $(event.target).find(' > .delete').show().end()
            $(event.target).closest("ul").not('.checktree').siblings('.delete').hide();
        });

        container.off('mouseleave', 'li').on('mouseleave', 'li', function(event) {
            if ( $(event.target).is('label') ) {
                return;
            }
            $(event.target).find(' > .delete').hide();
        });

        //delete node
        container.off('click', '.delete').on('click', '.delete', function () {
            console.log($(event.target).attr('rel'));
            var $li = $(this).closest("li");           
            if ( settings.onDeleteLi ) {
                settings.onDeleteLi($li, false);
            }

            // Remove all childs
            $(this).siblings('ul').find('#baseCheckbox.checked').each(function () {
                var $subli = $(this).closest("li");
                if (settings.onDeleteLi) {
                    settings.onDeleteLi($subli, false);
                }
            });

            // Remove from DOM
            $li.fadeOut(300, function(){
                $(this).remove();
            })
        });
                  
        //expand and collapse node
        container.off('click', '.arrow').on('click', '.arrow', function () {
            if ($(this).hasClass('nochildren')) {
                return;
            }

            var $li = $(this).closest("li");
            if (!$li.hasClass('updated')) {
                updateChildrenNodes($li, $.data($tree, $li.attr('rel')), true);
                $(this).removeClass('collapsed').addClass('expanded');
                if (settings.onExpand) {
                    settings.onExpand($li);
                }
            } else {
                $(this).siblings("ul").toggle();
                if ($(this).hasClass('collapsed')) {
                    $(this).removeClass('collapsed').addClass('expanded');
                    if (settings.onExpand) {
                        settings.onExpand($li);
                    }
                } else {
                    $(this).removeClass('expanded').addClass('collapsed');
                    if (settings.onCollapse) {
                        settings.onCollapse($li);
                    }
                }
            }
        });
    
        container.off('click', '.optionCheckbox').on('click', '.optionCheckbox', function() {
            $(this).removeClass('half_checked').toggleClass('checked');
            $(this).trigger('selectchange');
        });

        //check and uncheck node
        container.off('click', '#baseCheckbox').on('click', '#baseCheckbox', function () {
            var $li = $(this).closest("li");
            var dataSource = $.data($tree, $li.attr('rel'));
            if (!$li.hasClass('updated')) {
                updateChildrenNodes($li, dataSource, false);
            }

            if (settings.onPreCheck) {
                if (!settings.onPreCheck($li)) {
                    return;
                }
            }

            $(this).removeClass('half_checked').toggleClass('checked');

            if ($(this).hasClass('checked')) {
                dataSource.item.checked = true;
                if (settings.onCheck) {
                    settings.onCheck($li, true);
                }
                $li.find('.optionCheckbox').show();

                $(this).siblings('ul').find('#baseCheckbox').not('.checked').removeClass('half_checked').addClass('checked').each(function () {
                    var $subli = $(this).closest("li");
                    $.data($tree, $subli.attr('rel')).item.checked = true;
                    if (settings.onCheck) {
                        settings.onCheck($subli, false);
                    }
                });
            } else {
                dataSource.item.checked = false;
                if (settings.onUnCheck) {
                    settings.onUnCheck($li, true);
                }
                $li.find('.optionCheckbox').hide();

                $(this).siblings('ul').find('#baseCheckbox').filter('.checked').removeClass('half_checked').removeClass('checked').each(function () {
                    var $subli = $(this).closest("li");
                    $.data($tree, $subli.attr('rel')).item.checked = false;
                    if (settings.onUnCheck) {
                        settings.onUnCheck($subli, false);
                    }
                });
            }

            $(this).parents('ul').siblings('#baseCheckbox').trigger('selectchange');
        });

        //click label also trigger check action
        container.off('click', 'label').on('click', 'label', function () {
            $(this).prev('#baseCheckbox').trigger('click');
        });

        container.off('mouseenter', 'label').on('mouseenter', 'label', function(){
            $(this).addClass("hover");
            if (settings.onLabelHoverOver) settings.onLabelHoverOver($(this).closest("li"));
            // HACK: mouseover doesn't always fires on li element when passing by label..
            $(event.target).siblings('.delete').show();
        });

         container.off('mouseleave', 'label').on('mouseleave', 'label', function(event){
            $(this).removeClass("hover");
            if (settings.onLabelHoverOut) settings.onLabelHoverOut($(this).closest("li"));

            // HACK: mouseleave doesn't always fires on li element when passing by label..
            $(event.target).siblings('.delete').hide();
        });
    };
})(jQuery);
