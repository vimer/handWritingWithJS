/*!
 \ @brief 手写毛笔
 \ @author 疯哥
 \ @blog http://vimer.me
 \ @date 2015.1.21
 */
define(function(require, exports, module) {

	var HandWritingBrush = function() { };
	HandWritingBrush.prototype = {
		isDrawing : false,
		lastPoint : {x:0, y:0},
		maxPointSize : 58, // 50, 
		minPointSize : Math.round(this.maxPointSize/10), //5
		lastTime : 0,
		piecePoints : [],
		pieceSpeed : [],
		points: [],
		speed:[],
		wordsPoints: [],
		wordsSpeed: [],
		margin_left : 0,
		lineWords : 0,
		totalWords : 0,
		wordInterval_width : 0,
		wordInterval_height : 0,
		steps : [],
		lastStep : -1,
		top:0,
		left:0
	}

	HandWritingBrush.prototype.init = function(maxPointSize) {
		this.maxPointSize = maxPointSize;
	}

	HandWritingBrush.prototype.start = function(e) {

		this.isDrawing = true;
		this.x = e.pageX || e.touches[0].pageX;
		this.y = e.pageY || e.touches[0].pageY;

		var startX = this.x-this.left + this.margin_left;
		var startY = this.y-this.top;;

		//console.log(this.x,startX, startY,this.canvas[0].width, this.margin_left,window.innerWidth);
		this.lastPoint = {x:startX, y:startY};
		this.lastTime = Date.now();

		this.pieceSpeed.push(0);
		this.piecePoints.push({x:startX, y:startY});
		this.wordsSpeed.push(0);
		this.wordsPoints.push({"x":startX, "y":startY});

		e.preventDefault();
	}

	HandWritingBrush.prototype.move = function(e) {
		
		var ee = this.getEventOffset(e);

		if (this.isDrawing) {
			var startX = this.x-this.left+1 + this.margin_left;
			var startY = this.y-this.top+1;

			var currentPoint = {x:startX, y:startY};

			var currentTime = Date.now();
			var dist = this.getDist(this.lastPoint, currentPoint);
			speed = this.getSpeed(dist, currentTime-this.lastTime);

			this.piecePoints.push({x:startX, y:startY});
			if (speed == null) {speed = 0};
			this.pieceSpeed.push(speed);
			this.wordsSpeed.push(speed);
			this.wordsPoints.push({"x":startX, "y":startY});
			//this.cardMust.push({x:startX, y:startY, speed:speed, totalWords:this.totalWords, newPen:0});
			this.lastPoint = currentPoint;
			this.lastTime = currentTime;
			this.pathing(this.piecePoints, this.pieceSpeed, this.totalWords);

			this.x = ee.x;
			this.y = ee.y;
		}
		e.preventDefault();
	}
	
	HandWritingBrush.prototype.getPointSize = function(f) {
		var pointSize =  this.maxPointSize / 3 - 6 * f; //4.8, 6(ios)
		if (pointSize <= 0) {
			return this.minPointSize;
		} else {
			return pointSize;
		}
	}

	HandWritingBrush.prototype.pathing = function(piecePoints, pieceSpeed, totalWords) {

		var _points = [];
		var _speed = [];

		//console.log(piecePoints.length)
		if (piecePoints.length >= 3) {
			var piecePointsLen = piecePoints.length;
			var pieceSpeedLen = pieceSpeed.length;
			var point1 = piecePoints[piecePointsLen-3]
			var point2 = piecePoints[piecePointsLen-2];
			var point3 = piecePoints[piecePointsLen-1];
			var speed1 = pieceSpeed[pieceSpeedLen-3];
			var speed2 = pieceSpeed[pieceSpeedLen-2];
			var speed3 = pieceSpeed[pieceSpeedLen-1];

			_points.push(point1);
			_points.push(point2);
			_points.push(point3);
			_speed.push(speed1);
			if (speed2 > (speed1 + speed3)) {
				speed2 = (speed1+speed3) / 2 ;
			}
			_speed.push(speed2);
			_speed.push(speed3);
		} else {
			_points = piecePoints.concat();
			_speed = pieceSpeed.concat();
		}
		var img = $("#brush > img")[0];
		//console.log("pathing start");
		for (var i=0; i<_points.length; i++) {
			if (i < (-1 +_points.length)) {
				var point1 = _points[i];
				var point2 = _points[i+1];
				var pointSize1 = this.getPointSize(_speed[i]);
				var pointSize2 = this.getPointSize(_speed[i+1]);

				var dist = this.getDist(point1, point2);
				dist = dist / 2;
				var drawx = (point2.x - point1.x) / dist;
				var drawy = (point2.y - point1.y) / dist;
				var drawFudeSize = (pointSize2 - pointSize1) / dist;

				for (var j=0; j<dist; j++) {
					var left = (point1.x - pointSize1 / 2) + (drawx - drawFudeSize/2)*j;
					var top = (point1.y - pointSize1 / 2) + (drawy - drawFudeSize/2)*j;
					var right = (point1.x + pointSize1 / 2) + (drawx + drawFudeSize/2)*j;
					var bottom = (point1.y + pointSize1 / 2) + (drawy + drawFudeSize/2)*j;

					this.pan.drawImage(img, left, top, right-left, bottom-top);
				}
			}
		}
		_speed.length = 0;
		_points.length = 0;
	}

	HandWritingBrush.prototype.end = function(e) {
		var currentStep = this.canvas[0].toDataURL();
		if (this.isDrawing) {
			this.isDrawing = false;
			this.piecePoints.length = 0;
			this.pieceSpeed.length = 0;
		}
		e.preventDefault();
		return currentStep;
	}

	HandWritingBrush.prototype.getDist = function(p1, p2) {
		return  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}

	HandWritingBrush.prototype.getSpeed = function(dis, time) {
		return Math.round(dis / time);
	}

	HandWritingBrush.prototype.getScroll = function () {
		return result = {
			x:window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft,
			y:window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
		};
	}

	HandWritingBrush.prototype.getEventOffset = function (e) {
		var type = e.type, result = {};
		if (type === 'touchstart' || type === 'touchmove' || type === 'touchend') {
			result.x = e.touches[0].pageX;
			result.y = e.touches[0].pageY;

		} else if (e.pageX && e.pageY) {
			result.x = e.pageX || e.touches[0].pageX;
			result.y = e.pageY || e.touches[0].pageY;

		} else {
			result.x = this.getScroll().x + e.clientX;
			result.y = this.getScroll().y + e.clientY;
		}
		return result;
	}

	HandWritingBrush.prototype.storeStep = function() {
		var currentStep = this.canvas[0].toDataURL();
		this.steps.push(currentStep);
		this.lastStep++;
	}

	HandWritingBrush.prototype.clear = function() {
		this.pan.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);
	}

	return HandWritingBrush;
});

