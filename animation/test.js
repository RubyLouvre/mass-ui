require("fx,more/random,event,ready", function($, random) {
    var h = $("#hide").click(function() {
        h.hide(1000, function() {
            h.css("background", "blue").show(1000);
        });
    });

    $("#toggle_btn").click(function() {
        $("#toggle").toggle(1000);
    });
    var c = $("#color").click(function() {
        c.fx({
            background: random.rgb()
        }, 2000)
    });
    $("#slide_btn").click(function() {
        $("#slideToggle").slideToggle(1000);
    });
    $("#scroll_btn").click(function() {
        $("#hide").fx({
            scrollTop: 400
        }, 2500, function() {
            $("#hide").delay(500).fx({
                scrollTop: 0
            })
        })
    });
    $("#fade_btn").click(function() {
        $("#fadeToggle").fadeToggle(1000)
    });


    $("#puff").click(function() {
        $("#puff").puff(1000, function(node) {
            $(node).show()
        })
    });
    $("#rotate").click(function() {
        $("#rotate").fx({rotate: "+=170"}, 1000)
    })


    $(".box").click(function() {
        $(".box").fx({
            width: 200,
            height: 200,
            background: "#7CFC00",
            fontSize: 36,
            record: 1
        }, 2000).fx({
            width: 70,
            height: 70,
            background: "red",
            fontSize: 14,
            revert: 1
        }, 2000);
    })

})