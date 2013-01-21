/*
 * Webtools Annotation Plugin
 * http://
 *
 * Copyright 2012, Joel Dies
 * Author: Joel Dies
 * Version 0.0.1
 */

 /**
  * @fileOverview Annotation Plugin for Webtools
  * @author Joel T. Dies
  * @version: 0.1.3
  */
(function (jQuery) {
    var methods = {
        /**
         * Base initialization method
         *
         * @memberOf jQuery.annotate
         */
        init : function (el, options, modes) {
            var defaultmodes = {
                "Annotate": 0, // 0 = Idle, 1 = Ready, 2 = Drawing, 3 = End
                "Move": 0, // 0 = Idle, 1 = Ready, 2 = Moving, 3 = End
                "Resize": 0 // 0 = Idle, 1 = Ready, 2 = Resizing, 3 = End
            };

            var defaults = {};
            var base = this; // To avoid scope issues, use 'base' instead of 'this' to reference this class from internal events and functions.
            var modes = jQuery.extend(defaultmodes, modes);
            options = jQuery.extend(defaults, options);

            jQueryel = jQuery(el); // Access to jQuery version of element
            el = el; // Access to DOM version of element

            jQueryel.data("annotate", base); // Add a reverse reference to the DOM object

            methods.buildNotebox(options, modes);
            var offsetX = 0, offsetY = 0;

            jQuery(document).mouseup(function (e) {
                //if (!e.ctrlKey) options.keyctrl = false;
                switch(modes.Annotate) {
                    case 1: // Ready
                        break;
                    case 2: // Move
                        if (jQuery("#crosshair").length > 0) {
                            id = options.annotatecount + 1;
                            options.notes[id] = {
                                "id" : id,
                                "hidden": false,
                                "title": "",
                                "groups": [],
                                "overlay": {
                                    "x1": parseInt(jQuery("#crosshair").offset().left),
                                    "x2": parseInt(jQuery("#crosshair").width()),
                                    "y1": parseInt(jQuery("#crosshair").offset().top),
                                    "y2": parseInt(jQuery("#crosshair").height()),
                                    "axis": "center"
                                },
                                "comments": [],
                            };
                            jQuery('#crosshair').remove();
                            methods.destroyModal(options, modes);
                            options.e = e;
                            options.data = options.notes[id];
                            options = methods.createNote(options, modes);
                            options.selectedNote = options.data.id;
                            jQuery('#crosshair').remove();
                            methods.destroyModal(options, modes);
                            jQuery("#webtools_topcontainer span.Annotate").click();
                            jQuery('#annotation'+(id)).click();
                        }
                        break;
                    case 3: // End
                        modes.Move = 1;
                        break;
                    default: // 0 = Idle
                        break;
                }
                switch(modes.Move) {
                    case 1: // Ready
                        modes.Move = 0;
                        break;
                    case 2: // Move
                        modes.Move = 0;
                        methods.buildModal({
                            "a": parseInt(jQuery('#crosshair').offset().left) + 1,
                            "b": parseInt(jQuery('#crosshair').offset().top) + 1,
                            "c": parseInt(jQuery('#crosshair').offset().left) + parseInt(jQuery('#crosshair').width()) + 1,
                            "d": parseInt(jQuery('#crosshair').offset().top) + parseInt(jQuery('#crosshair').height()) + 1
                        }, modes);
                        options.notes[options.selectedNote].overlay = {
                                "x1": parseInt(jQuery('#crosshair').offset().left),
                                "x2": parseInt(jQuery('#crosshair').offset().left) + parseInt(jQuery('#crosshair').width()),
                                "y1": parseInt(jQuery('#crosshair').offset().top),
                                "y2": parseInt(jQuery('#crosshair').offset().top) + parseInt(jQuery('#crosshair').height())
                        }
                        jQuery('#annotation' + options.selectedNote).css({
                            "left": parseInt(jQuery('#crosshair').offset().left) - 19,
                            "top": parseInt(jQuery('#crosshair').offset().top) - 45
                        })
                        methods.populateNotebox(options.notes[options.selectedNote]);
                        jQuery('.noteBox').show();
                        break;
                    case 3: // End
                        modes.Move = 0;
                        break;
                    default: // 0 = Idle
                        break;
                }
                switch(modes.Resize) {
                    case 1: // Ready
                        modes.Resize = 0;
                        break;
                    case 2: // Resize
                        modes.Resize = 0;
                        methods.buildModal({
                            "a": parseInt(jQuery('#crosshair').offset().left) + 1,
                            "b": parseInt(jQuery('#crosshair').offset().top) + 1,
                            "c": parseInt(jQuery('#crosshair').offset().left) + parseInt(jQuery('#crosshair').width()) + 1,
                            "d": parseInt(jQuery('#crosshair').offset().top) + parseInt(jQuery('#crosshair').height()) + 1
                        }, modes);
                        jQuery('.noteBox').each(function() { jQuery(this).show(); });
                        break;
                    case 3: // End
                        modes.Resize = 0;
                        break;
                    default: // 0 = Idle
                        break;
                }
            }).mousedown(function (e) {
                if (modes.Annotate > 0 ||
                        modes.Move > 0 ||
                        modes.Resize > 0)
                    e.preventDefault();
                /*
                if (jQuery(e.target).parents('#container > .content').length > 0 ||
                    e.target.tagName == "HEADER" ||
                    e.target.tagName == "FOOTER") [
                */
                    switch(modes.Annotate) {
                        case 1: // Ready
                            if (options.shownotes && !jQuery('.Annotate ').hasClass('disabled')) {
                                if ((!jQuery(e.target).parents().hasClass('webtools') && !jQuery(e.target).hasClass('webtools'))) {
                                    e.preventDefault();

                                    var x = parseInt(e.pageX? e.pageX : e.clientX) - parseInt(jQuery('body').offset().left);
                                    var y = parseInt(e.pageY? e.pageY : e.clientY) - parseInt(jQuery('body').offset().top);

                                    methods.buildCrosshair({
                                        "height": 24+"px",
                                        "left": x+"px",
                                        "top": y-24+"px",
                                        "width": 150+"px"
                                    }, modes);
                                    jQuery('.toggleannotate > div').click();
                                    modes.Annotate = 2;
                                }
                            }
                            break;
                        case 2: // Resize
                            modes.Annotate = 3;
                            break;
                        case 3: // End
                            modes.Resize = 1;
                            break;
                        default: // 0 = Idle
                            break;
                    }
                    switch(modes.Move) {
                        case 1: // Ready
                            modes.Move = 2;
                            offsetX = parseInt(e.pageX? e.pageX : e.clientX) - parseInt(jQuery("#crosshair").css('left'));
                            offsetY = parseInt(e.pageY? e.pageY : e.clientY) - parseInt(jQuery("#crosshair").css('top'));
                            jQuery('.modal').remove();
                            jQuery('.noteBox:visible').hide();
                            break;
                        case 2: // Move
                            break;
                        case 3: // End
                            break;
                        default: // 0 = Idle
                            break;
                    }
                    switch(modes.Resize) {
                        case 1: // Ready
                            modes.Resize = 2;
                            jQuery('.modal').remove();
                            jQuery('.noteBox:visible').hide();
                            break;
                        case 2: // Resize
                            break;
                        case 3: // End
                            break;
                        default: // 0 = Idle
                            break;
                    }
                //]
            }).mousemove(function(e) {
                if (modes.Annotate != 0 || modes.Move != 0 || modes.Resize != 0)
                    jQuery('body div#container div.cover').show()
                else
                    jQuery('body div#container div.cover').hide()
                switch(modes.Annotate) {
                    case 1: // Ready
                        break;
                    case 2: // Move
                        if (jQuery("#crosshair").length > 0) {
                            var x = parseInt(e.pageX? e.pageX : e.clientX);
                            var y = parseInt(e.pageY? e.pageY : e.clientY);
                            var w = x - parseInt(jQuery('body').offset().left) - parseInt(jQuery("#crosshair").css('left'));
                            var h = y - parseInt(jQuery('body').offset().top) - parseInt(jQuery("#crosshair").css('top'));

                            if (x > parseInt(jQuery("#crosshair").offset().left)) {
                                jQuery("#crosshair").css("width", w+"px");
                                jQuery("#crosshairTitlebox").css({"width": w+"px"});
                            }
                            else {
                                jQuery("#crosshair").css("left", (x - parseInt(jQuery('body').offset().left) + 0)+"px");
                                jQuery("#crosshairTitlebox").css({"width": w+"px"});
                            }

                            if (y > jQuery("#crosshair").offset().top)
                                jQuery("#crosshair").css("height", h+"px");
                            else
                                jQuery("#crosshair").css("top", parseInt(y - parseInt(jQuery('body').offset().top))+"px");
                        }
                        break;
                    case 3: // End
                        modes.Annotate = 1;
                        break;
                    default: // 0 = Idle
                        break;
                }
                switch(modes.Move) {
                    case 1: // Ready
                        break;
                    case 2: // Move
                        var x = parseInt(e.pageX? e.pageX : e.clientX);
                        var y = parseInt(e.pageY? e.pageY : e.clientY);

                        jQuery('#crosshair').css({
                            "left": (x - offsetX) + "px",
                            "top": (y - offsetY) + "px",
                        });
                        break;
                    case 3: // End
                        modes.Move = 1;
                        break;
                    default: // 0 = Idle
                        break;
                }
                switch(modes.Resize) {
                    case 1: // Ready
                        break;
                    case 2: // Resize
                        var x = parseInt(e.pageX? e.pageX : e.clientX) - parseInt(jQuery('#crosshair').offset().left);
                        var y = parseInt(e.pageY? e.pageY : e.clientY) - parseInt(jQuery('#crosshair').offset().top);

                        jQuery('#crosshairTitlebox').css({
                            "width": x+"px"
                        });
                        jQuery('#crosshair').css({
                            "height": y+"px",
                            "width": x+"px"
                        });
                        break;
                    case 3: // End
                        modes.Resize = 1;
                        break;
                    default: // 0 = Idle
                        break;
                }
            });
            jQuery("span.Annotate").each(function() {
                jQuery(this).click(function() {
                    if (!jQuery('.Annotate ').hasClass('disabled')) {
                        if (jQuery(this).hasClass("toggled")) {
                            jQuery("span.Annotate").removeClass("toggled");
                            modes.Annotate = 0;
                        }
                        else {
                            jQuery("span.Annotate").addClass("toggled");
                            modes.Annotate = 1;
                        }
                    }
                });
            }).addClass("left");

            if (jQuery('body').css("position") != 'relative')
                jQuery('body').css({ "position": "relative" });
            methods.Read(options, modes);
        },

        /**
         * Creates an instance of the crosshair from mouse coordinates.
         *
         * @memberOf jQuery.webtools
         * @param options An object to hold various sub options.
         * @param options.title Title for the crosshair.
         * @param options.left Optional Left position of the crosshair.
         * @param options.top Optional Top position of the crosshair.
         * @param options.height Optional height position of the crosshair.
         * @param options.width Optional Width position of the crosshair.
         */
        buildCrosshair : function(options, modes) {
            var defaults = {
                "height": 100+'px',
                "left": 0,
                "top": 0,
                "width": 150+'px'
            };
            var options = jQuery.extend(defaults, options);
            if (jQuery("#crosshair").length != 1)
                jQuery("#crosshair").remove();
            var crosshair = jQuery(document.createElement('div')).attr({"id": "crosshair"}).show();
            crosshair
                .append(
                    jQuery(document.createElement('div'))
                        .addClass('gradient silver')
                        .attr({"id": "crosshairTitlebox"})
                        .append(jQuery(document.createElement('span')).text(options.title),
                            jQuery(document.createElement('span')).addClass('watch smbtn').click(function() { alert('Future feature for Watching webtoolss.'); }))
                        .mouseup(function(e) {
                            e.preventDefault();
                        })
                        .mousedown(function(e) {
                            e.preventDefault();
                            modes.Move = 1;

                        })
                        .mousemove(function(e) {
                            e.preventDefault();
                        }),
                    jQuery(document.createElement('span'))
                        .addClass('movebox smbtn')
                        .mouseup(function(e) {
                            e.preventDefault();
                        })
                        .mousedown(function(e) {
                            e.preventDefault();
                            modes.Resize = 1;

                        })
                        .mousemove(function(e) {
                            e.preventDefault();
                        })
                )
                .css({
                    "height": options.height,
                    "left": options.left,
                    "top": options.top,
                    "width": options.width
                });
            jQuery('body').prepend(crosshair);

            return jQuery('#crosshair');
        },

        /**
         * Creates an instance of the modal with 4 divs that create a portlet
         * to view through the modal.
         *
         * @memberOf jQuery.annotate
         * @param options An object to hold various sub options.
         * @param options.a Left position of the crosshair.
         * @param options.b Top position of the crosshair.
         * @param options.c Right position of the crosshair.
         * @param options.d Bottom position of the crosshair.
         * @param options.e [] This is an opional for the height of the top menu height.
         * @param options.f [] This is an opional for the height of the top menu width.
         */
        buildModal : function (options, modes) {
            var defaults = {
                "a": "0", // Left
                "b": "0", // Top
                "c": "0", // Right
                "d": "0", // Bottom
                "e": $(window).height(), // Page Height
                "f": $(window).width()  // Page Width
            };
            var options = jQuery.extend(defaults, options);

            //var pageHeight = parseInt(jQuery(document).height() > jQuery(window).height()? jQuery(document).height(): jQuery(window).height())

            /* -------- Top Left -------- */
            jQuery(document.createElement('div')).addClass('modal top left').css({
                "height": (options.b) + "px",
                "left": 0 + "px",
                "top": 0 + "px",
                "width": options.c + "px",
            }).appendTo('body');
            /* -------- Top Right -------- */
            jQuery(document.createElement('div')).addClass('modal top right').css({
                "height": options.d + "px",
                "left": options.c + "px",
                "top": 0 + "px",
                "width": (options.f - options.c) +"px",
            }).appendTo('body');
            console.log(jQuery('.modal.top.right').css('height'))
            /* -------- Bottom Right -------- */
            jQuery(document.createElement('div')).addClass('modal bottom right').css({
                "height": (options.e  - options.d) + "px",
                "left": options.a + "px",
                "top": options.d + "px",
                "width": (options.f - options.a) + "px",
            }).appendTo('body');
            /* -------- Bottom Left -------- */
            jQuery(document.createElement('div')).addClass('modal bottom left').css({
                "height": options.e  - options.b + "px",
                "left": 0 + "px",
                "top": options.b + "px",
                "width": options.a + "px",
            }).appendTo('body');

            jQuery('.modal').click(function() {
                jQuery('#crosshair').remove();
                methods.destroyModal(options, modes);
            });
        },

        /**
         * Creates an instance of a note on the page.
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         * @param {object} options.annotate Prebuilt note annotation.
         * @param {object} options.data Required data for note to populate.
         * @param {number} options.data.id Identifier for the note.
         * @param {string} options.data.title A string to represent the note title.
         * @param {object} options.data.id.overlay An object to hold the coords.
         * @param {number} options.data.id.overlay.x1 Left coord.
         * @param {number} options.data.id.overlay.x2 Right coord.
         * @param {number} options.data.id.overlay.y1 Top coord.
         * @param {number} options.data.id.overlay.y2 Bottom coord.
         * @param {object} options.data.comments An object to hold comments.
         * @param {array} options.data.comments[] An array to hold individual comments.
         * @param {string} options.data.comments[].user Username used for the comment.
         * @param {string} options.data.comments[].datetime Date and Time stamp.
         * @param {string} options.data.comments[].comment The actual comment.
         * @param {boolean} options.data.hidden Not used currently
         */
        buildNote : function(options, modes) {
            var defaults = {
                "annotate": jQuery(document.createElement('div'))
                    .addClass("annotateNote gradient silver")
                    .css({
                        "display": (options.shownotes? "inline-block": "none")
                    })
                    .appendTo("body #container")
            };
            var options = jQuery.extend(defaults, options);
            var note = options.annotate;

            note
                .addClass("annotation notes")
                .append(options.data.id)
                .attr({"href": "#", "id": "annotation" + options.data.id})
                .css({
                    "left": (options.data.overlay.x1 - (parseInt(note.width()) / 2)) - $('#container').offsetX + "px",
                    "top": (options.data.overlay.y1 - parseInt(note.height())) - 10 + "px"
                })
                .click(function() {
                    jQuery(this).css({"z-index": parseInt(jQuery(this).css("z-index")) + 1});
                    jQuery(".notes").each(function() { jQuery(this).hide(); });
                    jQuery(this).show();
                    methods.populateNotebox(options.notes[options.data.id]);
                    options.selectedNote = options.data.id;
                    if (jQuery('.modal').length == 0) {
                        var crosshair = methods.buildCrosshair({
                            "title": options.data.title,
                            "height": options.data.overlay.y2 + "px",
                            "left": options.data.overlay.x1 + "px",
                            "top": options.data.overlay.y1 + "px",
                            "width": options.data.overlay.x2 + "px"
                        }, modes);
                        crosshair.show();
                        jQuery('#crosshairTitlebox')
                            .append(
                                jQuery(document.createElement('span'))
                                    .addClass('noteClose smbtn')
                                    .click(function() {
                                        jQuery(this).find(".noteBox").hide();
                                        jQuery("#crosshair").remove();
                                        methods.destroyModal(options, modes);
                                })
                            )
                            .width(options.data.overlay.x2);
                        methods.buildModal({
                            "a": options.data.overlay.x1 + 1,
                            "b": options.data.overlay.y1 + 1,
                            "c": parseInt(jQuery('#crosshair').offset().left) + parseInt(jQuery('#crosshair').width()) + 1,
                            "d": parseInt(jQuery('#crosshair').offset().top) + parseInt(jQuery('#crosshair').height()) + 1
                        }, modes);
                    }
                    //jQuery('.scroll-pane').jScrollPane();
                });

            if (options.data.comments.length > 0) {
                for (i in options.data.comments) {
                    var c = options.data.comments[i];
                    note.find("ul").append("<li>" + c.comment + "</li>");
                }
            }
            if (typeof comments == "object" && comments) {
                for (n in comments) {
                    //comments = ((comments == "@empty")? "": comments);
                    if (comments[n] != '@empty')
                        note.find("ul").append("<li>" + comments[n] + "</li>");
                }
                comments.parents().find("ul").show();
            }

            return options;
            delete note;
        },

        /**
         * Creates an instance of the notebox popup
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         */
        buildNotebox : function(options) {
            var defaults = {
                "noteBox": jQuery(document.createElement('div'))
                    .addClass("noteBox gradient silver")
                    .append(
                        jQuery(document.createElement('span')).addClass('annotateInfo smbtn'),
                        jQuery(document.createElement('span')).addClass('Options smbtn right'),
                        jQuery(document.createElement('span')).addClass("noteBoxTitle"),
                        jQuery(document.createElement('hr')),
                        jQuery(document.createElement('label')).addClass("fll").text("Title"),
                        jQuery(document.createElement('input')).addClass("fll").attr({"type": "text"}).addClass("noteBoxTitle"),
                        jQuery(document.createElement('div')).addClass("clear"),
                        jQuery(document.createElement('label')).addClass("fll").text("Group"),
                        jQuery(document.createElement('select')).addClass("fll"),
                        jQuery(document.createElement('div')).addClass("clear"),
                        jQuery(document.createElement('label')).addClass("fll").text("Comment"),
                        jQuery(document.createElement('textarea')).addClass("fll"),
                        jQuery(document.createElement('div')).addClass("clear"),
                        jQuery(document.createElement('div'))
                            .css({"margin-top": "56px"})
                            .append(
                                jQuery(document.createElement('a'))
                                    .addClass("noteSave notebtn")
                                    .text("Save")
                                    .click(function() {
                                        //var id = parseInt(jQuery(this).parent().attr("id").replace("annotation",""));
                                        var update = methods.Update({
                                            "action": 'updateAnnotation',
                                            "id"    : options.id,
                                            "overlay": {
                                                "x1": parseInt(jQuery('#crosshair').offset().left),
                                                "x2": parseInt(jQuery('#crosshair').width()),
                                                "y1": parseInt(jQuery('#crosshair').offset().top),
                                                "y2": parseInt(jQuery('#crosshair').height())
                                            },
                                            "title": noteBox.find('input.noteBoxTitle').val(),
                                            "groups": [0],
                                            "comments": noteBox.find('textarea').val(),
                                        });
                                        if (update) {
                                            if (noteBox.find("ul").length != 0)
                                                noteBox.find("ul").append(jQuery(document.createElement("li")).text(noteBox.find('textarea').val()));
                                            else {
                                                jQuery(this).parent().append(jQuery(document.createElement('ul')));
                                                noteBox.find("ul").append(jQuery(document.createElement("li")).text(noteBox.find('textarea').val()));
                                            }
                                        }
                                    }),
                                /*
                                jQuery(document.createElement('a'))
                                    .addClass("noteClear notebtn")
                                    .text("Clear")
                                    .click(function() {
                                        jQuery(this).parent().prev().val("");
                                    }),
                                */
                                jQuery(document.createElement('a'))
                                    .addClass("noteDelete notebtn")
                                    .text("Delete")
                                    .click(function() {
                                        methods.Update({
                                            "action": 'updateAnnotation',
                                            "id"    : options.id,
                                            "hidden": true
                                        });
                                        methods.Delete({"id": options.id});
                                    })
                            ),
                        jQuery(document.createElement('hr')),
                        jQuery(document.createElement('ul')).addClass('scroll-pane'),
                        jQuery(document.createElement('div')).addClass("arrowleft"),
                        jQuery(document.createElement('div')).addClass("arrowright")
                    )
            };
            var options = jQuery.extend(defaults, options);

            var noteBox = options.noteBox;

            jQuery('body').append(noteBox.hide());
            delete noteBox;
        },

        /**
         * Creates an instance of the note.
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         * @TODO Need to rename function
         */
        createNote : function (options, modes) {
            if (options && options.e) e = options.e;
            console.log(options)
            if (!options.id) {
                jQuery.ajax({
                    url: options.server,
                    type: 'POST',
                    async: false,
                    cache: false,
                    timeout: 30000,
                    data: {
                        "action": "c",
                        "projecturl": window.location.pathname
                    },
                    error: function(){
                        return true;
                    },
                    success: function (data) {
                        data = eval('(' + data + ')');
                        var annoli = jQuery(document.createElement('li'));
                        options.note = ((data.note == "@empty")? "": data.note);

                        // Need a way that if it is blank to delete its self.
                        methods.Update({
                            "noteid": options.data.id,
                            "xcoord": options.data.overlay.x1,
                            "ycoord": options.data.overlay.y1
                        });

                        annoli.html('<a href="#">Note: ' + options.data + '</a>').attr({
                            "id": "annotateitem" + options.data
                        })
                    }
                });
            }
            //var annoli = jQuery(document.createElement('li'));

            if (options.hidden == true) {
                note.hide();
                //annoli.css({"text-decoration": "line-through"});
            }
            /*
            annoli.html('<a href="#">Note: ' + options['@attributes'].id + '</a>').attr({
                "id": "annotateitem" + options['@attributes'].id
            });
            */
            options.annotatecount++;
            delete options.annotate;
            options = methods.buildNote(options, modes);
            var comments = $('.noteBox ul.scroll-pane')
            console.log(!comments.empty())
            if (!comments.empty()) {
                comments.show()
                comments.prev("hr").show()
            }
            else {
                comments.hide()
                comments.prev("hr").hide()
            }
            return options
            // if (options['@attributes'].status == 2)
                // note.addClass("annotateCompleted");
            // jQuery("#annotatelist").append(annoli);
            // If there are more then 5 notes remove the oldest created element
            // if (jQuery("#annotatelist li").length > options.maxlistcount) jQuery("#annotatelist li:first").remove();
        },

        /**
         * Sends back to the server to never show the annotation but keep a
         * record of it in the data
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         * @TODO Need to rename function
         */
        deleteNote : function(options) {
            var defaults = {
                "id": 0
            };
            var options = jQuery.extend(defaults, options);
            if (jQuery("div.annotationDelete" + options.id).length) {
                var e = "div#annotation" + options.id;
                jQuery(e).remove();
            }
        },

        /**
         * Creates an instance of.
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         */
        destroyModal : function (options, modes) {
            jQuery('.modal').remove();
            jQuery('.noteBox').hide();
            jQuery(".notes").each(function() { jQuery(this).show(); });
            if (!options.shownotes)
                jQuery(".toggleannotate div").click();
            modes.Move = 0;
            modes.Resize = 0;
        },

        /**
         * Creates an instance of.
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         */
        populateNotebox : function(options) {
            var defaults = {

            };
            var options = jQuery.extend(defaults, options);
            var noteBox = jQuery("body").find(".noteBox");
            var title = noteBox.find("span.noteBoxTitle");
            //var groups = noteBox.find("select");
            //var commentarea = noteBox.find("textarea");
            var comments = noteBox.find("ul");


            if (options.overlay.x1 > 320) {
                noteBox
                    .css({"left": parseInt(options.overlay.x1) - 390 + "px"});
                jQuery('.arrowleft').hide();
                jQuery('.arrowright').show().css("right", "-16px");
            }
            else {
                noteBox
                    .css({"left": (parseInt(options.overlay.x1) + parseInt(options.overlay.x2) + 20) + "px"});
                jQuery('.arrowleft').show().css("left", "-16px");
                jQuery('.arrowright').hide();
            }

            noteBox.css({
                "top": parseInt(options.overlay.y1) - 35 + "px",
                "z-Index": 8750
            });

            title.text(options.title);

            if (options.comments.length > 0) {
                options.comments.reverse();
                for (c in options.comments) {
                    comments.append(
                        jQuery(document.createElement('li')).append(
                            jQuery(document.createElement('div')).append(
                                jQuery(document.createElement('span')).addClass('arrow small right'),
                                jQuery(document.createElement('span')).addClass('user').text(options.comments[c].user + ":"),
                                jQuery(document.createElement('span')).addClass('datetime').text(options.comments[c].datetime)
                            ),
                            jQuery(document.createElement('span')).addClass('comment').text(options.comments[c].comment)
                        )
                    );
                }
            }
            jQuery('.arrowleft, .arrowright').css('top', '60px');
            /*
            var noteBoxbottom = parseInt(noteBox.offset().top) + parseInt(noteBox.height())
            if ((parseInt(options.overlay.y1) + parseInt(options.overlay.y2)) < noteBoxbottom) {
                var noteBoxnewtop = parseInt(noteBox.offset().top) - (noteBoxbottom - parseInt(jQuery(document).height()))
                if (0 < noteBoxnewtop) {
                    noteBox.css("top", parseInt(noteBox.offset().top) - parseInt(noteBox.height()) + 100)
                }
                else {

                }
            }
            */
            noteBox.show();
            delete noteBox;
        },

        /**
         * Creates an instance of.
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         */
        Read : function (options, modes) {
            var defaults = {
                "projecturl": window.location.pathname
            };
            var options = jQuery.extend(defaults, options);
            jQuery.get(options.server, {"action": "r", "projecturl": options.projecturl}, function (data) {
                data = eval("([" + data + "])");
                for (n in data) {
                    if (data[n].id) {
                        if (options.data)
                            delete(options.data);
                        options.notes[data[n].id] = data[n];
                        options = jQuery.extend({"data": data[n]}, options);
                        createNote(options, modes);
                    }
                }
            });
        },

        /**
         * Creates an instance of.
         *
         * @memberOf jQuery.annotate
         * @param {object} options An object to hold various sub options.
         */
        Update : function (options) {
            var defaults = {
                "action": "updateAnnotation",
                "projecturl": window.location.pathname
            };
            var options = jQuery.extend(defaults, options);
            jQuery.post(options.server, options);
            return "Update";
        }
    }

    /**
     * jQuery definition to anchor JsDoc comments.
     *
     * @see http://jQuery.com/
     * @name jQuery
     * @class jQuery Library
     */

    /**
     * jQuery 'fn' definition to anchor JsDoc comments.
     *
     * @see http://jQuery.com/
     * @name fn
     * @class jQuery Library
     * @memberOf jQuery
     */

    /**
     * jScrollPane definition to anchor JsDoc comments.
     *
     * @see http://jscrollpane.kelvinluck.com/
     * @name jscrollpane
     * @class jScrollPane
     * @memberOf jQuery
     */

    /**
     * Mouse Wheel definition to anchor JsDoc comments.
     *
     * @see http://brandonaaron.net
     * @name mousewheel
     * @class Mouse Wheel
     * @memberOf jQuery
     */

    /**
     * Mouse Wheel Intent definition to anchor JsDoc comments.
     *
     * @name mwheelIntent
     * @class Mouse Wheel Intent
     * @memberOf jQuery
     */

    /**
     * Annotation Class
     *
     * @namespace Annotation
     * @memberOf jQuery
     * @param {object} el Element
     * @param {object} options Options
     * @param {object} modes Avalible modes
     * @return {jQuery} chainable jQuery class
     * @requires jQuery 1.7
     * @requires jScrollPane
     * @requires Mouse Wheel
     * @requires Mouse Wheel Intent
     */
    jQuery.annotate = function (el, options, modes) {
        options = jQuery.extend(jQuery.annotate.defaultOptions, options);
        $(document).ready(function() {
            jQuery('#webtools-toolbar')
                .append(jQuery(document.createElement('a'))
                    .attr({"id":"toolbar-annotate"})
                    .append(jQuery(document.createElement('span')).addClass("Annotate smbtn")));
            methods.init(el, options, modes)
        });
    };

    /**
     * All avalible options.
     *
     * @memberOf jQuery.annotate
     * @ignore
     */

    jQuery.annotate.defaultOptions = {
        "annotate"      : null,
        "annotatecount" : 0,
        "keyctrl"       : false,
        "maxlistcount"  : 5,
        "notes"         : ({0: null}),
        "selectedNote"  : 0,
        "server"        : 'xml.php',
        "showhistory"   : false,
        "shownotes"     : true,
        "updatedelay"   : 2000
    };

    /**
     * All avalible modes.
     *
     * @memberOf jQuery.annotate
     */

    jQuery.annotate.defaultMode = {
        "Annotate": 0, // 0 = Idle, 1 = Ready, 2 = Drawing, 3 = End
        "Move": 0, // 0 = Idle, 1 = Ready, 2 = Moving, 3 = End
        "Resize": 0 // 0 = Idle, 1 = Ready, 2 = Resizing, 3 = End
    };

    /**
     * A jQuery Wrapper Function to append Annotation formatted text to a
     * DOM object converted to HTML.
     *
     * @namespace Annotation
     * @memberOf jQuery.fn
     * @param {method}
     * @return {jQuery} chainable jQuery class
     */
    $.fn.annotate = function(options) {
        return this.each(function () {
            (new $.annotate(this, options));
        });
    };

    /**
     * This Class breaks the chain, but returns the annotate if it has been
     * attached to the object.
     *
     * @namespace Get Annotate
     * @memberOf jQuery.fn
     */
    jQuery.fn.getannotate = function() {
        this.data("annotate");
    };
})(jQuery);
