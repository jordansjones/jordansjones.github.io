define(['underscore', 'backbone', 'keymaster', 'util', './Circle', './QuadTree'], function (_, Backbone, Keymaster, Util, Circle, Tree) {

	return Backbone.View.extend({

		$bounds: null,
		$canvas: null,
		$stage: null,

		$stats: null,

		$objects: [],
		$multipleObjectsPerClick: true,
		$isReset: false,

		$tree: null,

		initialize: function () {
			_(this).bindAll("tick", "onMouseUp", "onUpArrow", "onDownArrow", "onSpaceBar", "onNumberKey");

			this.$canvas = this.options.canvas;
		},

		render: function () {

			this.$bounds = new Rectangle();
			this.$bounds.height = Util.height;
			this.$bounds.width = Util.width;

			this.$stage = new Stage(this.$canvas.get(0));
			this.$stage.onMouseUp = this.onMouseUp;

			Keymaster('up', this.onUpArrow);
			Keymaster('down', this.onDownArrow);
			Keymaster('space', this.onSpaceBar);
			Keymaster('1, 2, 3, 4, 5, 6, 7, 8, 9, 0', this.onNumberKey);

			this.$tree = new Tree(this.$bounds, false, 7);

			this.loadStats();

			return this;
		},

		newCircle: function (xy) {
			var c = new Circle(xy).render(this.$stage);
			this.$objects.push(c);
			// this.$tree.insert(c);
		},

		run: function () {
			this.$stage.update();

			Ticker.useRAF = true;
			Ticker.setFPS(Util.framerate);
			// Ticker.setInterval(Util.frameinterval);

			Ticker.addListener(this);

			return this;
		},

		pause: function (doPause) {
			Ticker.setPaused(doPause);
			this.trigger("paused", doPause);
		},

		onSpaceBar: function () {
			this.pause(!Ticker.getPaused());
			return false;
		},

		onUpArrow: function (e) {
			this.generateBalls(1);
			return false;
		},

		onDownArrow: function (e) {
			var o = this.$objects.pop();
			if (!o) return;
			this.$stage.removeChild(o.$circle);
			Circle.decrement();
			return false;
		},

		onMouseUp: function(e) {
			if (!this.$stage.mouseInBounds) return;
			this.generateBalls(null, e);
		},

		onNumberKey: function(e) {
			if (!e || !e.keyCode || !_.isNumber(e.keyCode)) return;
			var num = e.keyCode - 48;
			if (num === 0)
				this.reset();
			else
				this.generateBalls(num);
			return false;
		},

		generateBalls: function(count, e) {
			count = count || (this.$multipleObjectsPerClick ? Util.randInt(2, 10) : 1);

			if (!e) {
				e = Util.randPoint();
			}
			var pos = {
				x: e.stageX || e.x,
				y: e.stageY || e.y
			};

			for (var i = 0; i < count; i++) {
				// for (var x = 0; x < 100000; x++) {}
				this.newCircle(pos);
			}
		},

		tick: function (msElapsed) {
			if (this.$isReset) return;
			for (var i = 0; i < this.$objects.length; i++) {
				if (this.$isReset) continue;
				if (!this.$objects[i]) continue;
				this.$objects[i].onTick(msElapsed);
			}
			this.updateTree();

			this.updateCollisions();


			if (this.$stats != null)
				this.$stats.onTick(msElapsed);

			this.$stage.update();
		},

		updateTree: function () {
			this.$tree.clear();
			this.$tree.insert(this.$objects);
		},

		reset: function () {
			this.$stage.removeAllChildren();
			this.$stats.reset();
			Circle.reset();
		},

		loadStats: function () {
			require(['application/Stats'], _.bind(function (Stats) {
				this.$stats = new Stats().render(this.$stage);
			}, this));
		},

		updateCollisions: function () {
			for (var i = 0, size = this.$objects.length; i < size; i++) {
				var o = this.$objects[i];
				var items = this.$tree.retrieve(o);
				for (var j = 0, iSize = items.length; j < iSize; j++) {
					var object = items[j];

					if (o == object) continue;
					if (o.$isColliding && object.$isColliding) continue;

					var dx = o.x - object.x;
					var dy = o.y - object.y;
					var rad = o.$radius + object.$radius;
					var isColliding = ((dx * dx) + (dy * dy)) < (rad * rad);

					if (!o.$isColliding)
						o.$isColliding = isColliding;

					if (!object.$isColliding)
						object.$isColliding = isColliding;
				}

			}
		}

	});

});
