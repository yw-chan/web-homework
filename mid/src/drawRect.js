function canvasSupport(e) {
    return !!e.getContext;
}
function CanvasApp(canvas_id) {
    let self = this;
    var myCanvas = document.getElementById(canvas_id);

    if (!canvasSupport(myCanvas)) {
        return;
    }

    var ctx = myCanvas.getContext('2d');

    myCanvas.addEventListener('mousedown', mouseDown, false);
    myCanvas.addEventListener('mouseup', mouseUp, false);
    myCanvas.addEventListener('mousemove', mouseMove, false);

    myCanvas.addEventListener('touchstart',touchStart, false);
    myCanvas.addEventListener('touchmove',touchMove, false);
    myCanvas.addEventListener('touchend',touchEnd, false);

    var rect = {},
        drag = false,
        isDraw = false;
    var imgData;

    this.setImg = function(){
        imgData = ctx.getImageData(0, 0, myCanvas.width, myCanvas.height);
        rect = {startX:0,startY:0,w:myCanvas.width,h:myCanvas.height};
    }
    this.getRect = function(){
        if(rect.w < 0){
            // console.log(rect);
            rect.w = -rect.w;
            rect.startX -= rect.w;
        }
        if(rect.h < 0){
            // console.log(rect);
            rect.h = -rect.h;
            rect.startY -= rect.h;
        }
        return rect;
    }
    this.setDraw = function(d){
        isDraw = d;
    }
    this.getImgData = function(){
        rect = this.getRect();
        console.log(rect);
        ctx.putImageData(imgData, 0, 0);
        var img = ctx.getImageData(rect.startX, rect.startY, rect.w, rect.h);
        drawRect("stroke");
        return img;
    }

    function mouseDown(e) {
        if (isDraw){
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            rect.startX = e.pageX - this.offsetLeft - 10;
            rect.startY = e.pageY - this.offsetTop - 10;
            ctx.moveTo(e.pageX - this.offsetX, e.pageY - this.offsetY);
        }
        drag = true;
    }

    function mouseUp() {
        drag = false;
    }

    function mouseMove(e) {
        if (isDraw && drag) {
            rect.w = (e.pageX - this.offsetLeft - 10) - rect.startX;
            rect.h = (e.pageY - this.offsetTop - 10) - rect.startY;
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            drawRect("stroke");
        }
    }
    // var x, y;
    function touchStart(e){
        var touch = e.targetTouches[0];
        if (isDraw){
            // x = window.pageXOffset,y = window.pageYOffset;
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            rect.startX = touch.pageX - this.offsetLeft - 10;
            rect.startY = touch.pageY - this.offsetTop - 10;
            ctx.moveTo(touch.pageX - this.offsetX, touch.pageY - this.offsetY);
            e.preventDefault();
        }
        drag = true;
    }

    function touchEnd(e){
        drag = false;
    }
    
    function touchMove(e){
        var touch = e.targetTouches[0];
        
        if (isDraw && drag) {
            rect.w = (touch.pageX - this.offsetLeft - 10) - rect.startX;
            rect.h = (touch.pageY - this.offsetTop - 10) - rect.startY;
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            drawRect("stroke");
            // window.scrollTo(x,y);
            // ctx.moveTo(touch.pageX-this.offsetX,touch.pageY-this.offsetY);
        }
    }

    function drawRect(style) {
        ctx.fillStyle = "#93fff638";
        ctx.strokeStyle = '#0099cc';
        if (style === "fill") {
            ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
        }
        if (style === "stroke") {
            ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
        }
    }
}