define("draggable", ["$attr", "$css"], function($) {


    $.fn.alignWith = function(node, pos, options) {
        node = $(node);

        var eOff = node.offset(),
                eX = eOff.left,
                eY = eOff.top,
                eW = node.outerWidth(),
                eH = node.outerHeight(),
                // Position placeholders
                pT = '',
                pE = '',
                args = [],
                // Position matching regex patterns
                rXM = /^([tbcm]{2}|lr|rl)$/i,
                rXR = /^r?[rtbcm]r?$/i,
                rYM = /^([lrcm]{2}|tb|bt)$/i,
                rYB = /^b?[lrbcm]b?$/i,
                tCss = {// CSS rules
            position: 'absolute',
            left: eX,
            top: eY
        },
        opts = {//默认配置
            x: 0,
            y: 0,
            appendTo: "body"
        };

        if (undefined !== options) {
            $.mix(opts, options);
        }
//如果都不合法,那么默认为固中
        if (!/^[tblrcm]{1,4}$/.test(pos)) {
            pos = 'c';
        }
// Flesh out 4-point position string
        args = pos.split('');
        switch (args.length) {
            case 1:
                pT = pE = '' + pos + pos;
                break;
            case 2:
                pT = pE = pos;
                break;
            case 3:
                pT = '' + args[0] + args[1];
                pE = '' + args[2] + args[2];
                break;
            case 4:
                pT = '' + args[0] + args[1];
                pE = '' + args[2] + args[3];
                break;
        }


// Move the nodeents
        return this.each(function() {
// Get dimensions for nodeent to move
            var t = $(this),
                    tX = eX,
                    tY = eY,
                    tW = t.outerWidth(),
                    tH = t.outerHeight();
            // Test for X-points of this
            if (rXM.test(pT)) {
                tX -= (tW / 2);
            } else if (rXR.test(pT)) {
                tX -= tW;
            }
// Test for X-points of node
            if (rXM.test(pE)) {
                tX += (eW / 2);
            } else if (rXR.test(pE)) {
                tX += eW;
            }
// Test for Y-points of this
            if (rYM.test(pT)) {
                tY -= (tH / 2);
            } else if (rYB.test(pT)) {
                tY -= tH;
            }
// Test for Y-points of node
            if (rYM.test(pE)) {
                tY += (eH / 2);
            } else if (rYB.test(pE)) {
                tY += eH;
            }
// Account for margins pushing out the position
// Also account for NaN values since IE reads an unset margin as 'auto' instead of '0px'
// (http://plugins.jquery.com/node/10969)
            tX -= parseInt(t.css('margin-left'), 10) || 0;
            tY -= parseInt(t.css('margin-top'), 10) || 0;
            // Add any offset specified in the options
            if (0 !== op.x) {
                tX += parseInt(op.x, 10);
            }
            if (0 !== op.y) {
                tY += parseInt(op.y, 10);
            }
// Apply css rules
            tCss.left = tX;
            tCss.top = tY;
            t.css(tCss);
            // Check for attachment option
            if (op.appendToBody) {
                t.appendTo('body');
            }
        });

    }
})
