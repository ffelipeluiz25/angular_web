var KnobHandler = (function () {
    var init = function () {
        var rtl = false;
        if ($('html').data('textdirection') == 'rtl')
            rtl = true;

        $(".knob").knob({
            rtl: rtl,
            draw: function () {
                var ele = this.$;
                var style = ele.attr('style');
                style = style.replace("bold", "normal");
                var fontSize = parseInt(ele.css('font-size'), 10);
                var updateFontSize = Math.ceil(fontSize * 1.65);
                style = style.replace("bold", "normal");
                style = style + "font-size: " + updateFontSize + "px;";
                var icon = ele.attr('data-knob-icon');
                ele.hide();
                $('<i class="knob-center-icon ' + icon + '"></i>').insertAfter(ele).attr('style', style);

                // "tron" case
                if (this.$.data('skin') == 'tron') {

                    this.cursorExt = 0.3;

                    var a = this.arc(this.cv), // Arc
                        pa, // Previous arc
                        r = 1;

                    this.g.lineWidth = this.lineWidth;

                    if (this.o.displayPrevious) {
                        pa = this.arc(this.v);
                        this.g.beginPath();
                        this.g.strokeStyle = this.pColor;
                        this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, pa.s, pa.e, pa.d);
                        this.g.stroke();
                    }

                    this.g.beginPath();
                    this.g.strokeStyle = r ? this.o.fgColor : this.fgColor;
                    this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, a.s, a.e, a.d);
                    this.g.stroke();

                    this.g.lineWidth = 2;
                    this.g.beginPath();
                    this.g.strokeStyle = this.o.fgColor;
                    this.g.arc(this.xy, this.xy, this.radius - this.lineWidth + 1 + this.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
                    this.g.stroke();

                    return false;
                }
            }
        });
    }

    return {
        Init: function () {
            init();
        }
    }

})(KnobHandler || {})

