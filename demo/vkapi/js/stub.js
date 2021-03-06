$(function() {
    window.wallSource = "";

    container = $("#container");
    window.scope = new Graphemescope( container[0] );

    resizeHandler = function() {
        container.height( $(window).height() );
        container.width( $(window).width() );
    };
    $(window).resize(resizeHandler);
    $(window).resize();

    function changeResources(imageSrc, music, callback) {
        var image = new Image();
        image.src = imageSrc;
        image.onload = function() {
            scope.setImage(image);
            scope.setAudio(music.url);
                $('#music-title').html(music.artist + " - " + music.title);
    
            callback();
        };
    }


    VK.init({
        apiId: 3300222
    });

    function authInfo(response) {
        if (response.session) {
            $('#login_button').hide();
            apiInitialized();
        } 
    }

    VK.Auth.getLoginStatus(authInfo);
    VK.UI.button('login_button');

    $('#login_button').click(function() {
        VK.Auth.login(authInfo);
    });


    var totalCount = 0;

    function apiInitialized() {
        container.click(function() {
            getNext(0);
        });


        getNext = function getNext() {
            var index = _.random(0, totalCount);
            

            VK.Api.call('wall.get', {
                offset : index,
                domain : wallSource,
                count  : 1,
                filter : 'owner'
            }, function(r) {  
                if(!(r.response && r.response[1] && r.response[1].attachments)) {
                    return getNext();
                }   


                var att = r.response[1].attachments;

                var photos = _(att).chain()
                    .filter(function(a) {
                        return (a.type === 'photo');
                    })
                    .map(function(a) {
                        return a.photo.src_xbig || a.photo.src_big;
                    })
                    .shuffle()
                    .value();

                var music = _(att).chain()
                    .filter(function(a) {
                        return (a.type == 'audio');
                    })
                    .map(function(a) {
                        return a.audio;
                    })
                    .shuffle()
                    .value();

                if(photos.length <= 0 || music.length <= 0) {
                    return getNext(index);
                }

                var imageSrc = photos[0];
                var musicSrc = music[0];

                changeResources(imageSrc, musicSrc, function() {});
            });
        }


       Router = Backbone.Router.extend({
            routes : {
                ":name" : "name",
                "" : "default"
            },

            name : function(name) {
                wallSource = name;

                VK.Api.call('wall.get', {
                    offset : 0,
                    domain : wallSource,
                    count  : 1,
                    filter : 'owner'
                }, function(r) {  
                    if(r.response && r.response[0]) {
                        totalCount = r.response[0];
                        getNext(); 
                    }
                });
            },

            default : function() {
                var that = this;
                VK.Api.call("users.get", {
                    "fields" : "screen_name"
                }, function(r) {
                    that.navigate(r.response[0].screen_name, {trigger: true});
                });
            }
       });

       new Router();
       Backbone.history.start();

    setInterval(getNext, 60000);
   } 


});
