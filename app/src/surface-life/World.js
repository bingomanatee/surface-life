define(function (require, exports, module) {

  var View = require('famous/core/View');
  var _ = require('lodash');
  var Transform = require('famous/core/Transform');
  var Surface = require('famous/core/Surface');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Engine = require('famous/core/Engine');
  var Fools = require('fools');

  function _generate_cells(i, j, k) {
    return _.map(_.range(0, i), function (ii) {
      return _.map(_.range(0, j), function (jj) {
        return _.map(_.range(0, k), function (kk) {
          return [];
        })
      })
    })
  }

  function World(i, j, k, size) {
    View.call(this);
    this.i = Math.max(1, Math.round(i)); // the horizontal extent
    this.j = Math.max(1, Math.round(j)); // the depth extent
    this.k = Math.max(1, Math.round(k)); // the vertical extent
    if (size) {
      this.options.CELL_SIZE = size;
    }
    this.beings = [];

    this.cells = _generate_cells(this.i, this.j, this.k);

    this._node.add(new StateModifier({
      transform: Transform.translate(0, 0, -0.5)
    })).add(new Surface({
      size: [i * this.options.CELL_SIZE, j * this.options.CELL_SIZE],
      properties: {
        backgroundColor: 'rgb(0, 51, 153)'
      }
    }));

    Engine.on('prerender', this.update_content.bind(this));
  }

  World.DEFAULT_OPTIONS = _.extend({CELL_SIZE: 100}, View.DEFAULT_OPTIONS);
  World.constructor = World;

  _.extend(World.prototype, View.prototype);

  _.extend(World.prototype, {

    update_content: function () {
      Fools.loop(function (iter) {
        var content = this.contents(iter.i, iter.j, iter.k);
        if (content) {
          //  console.log('stacking for ', iter);
          var n = content.length;
          if (n > 1){
            _.each(content, function (item, i) {
              item.stacking(i, n, content);
            })
          }
        }
      }.bind(this)).dim('i', 0, this.i).dim('j', 0, this.j).dim('k', 0, this.k)();
      Fools.loop(function (iter) {
        var content = this.contents(iter.i, iter.j, iter.k);
        if (content) {
          //  console.log('stacking for ', iter);
          var n = content.length;
          _.each(content, function (item, i) {
            item.setContent(n);
          })
        }
      }.bind(this)).dim('i', 0, this.i).dim('j', 0, this.j).dim('k', 0, this.k)();
    },

    constructor: World,

    contents: function (i, j, k) {

      if (this.cells[i] && this.cells[i][j]) {
        return this.cells[i][j][k];
      } else {
        return false;
      }
    },

    remove_item: function (i, j, k, item) {
      contents = this.contents(i, j, k);
      if (contents && _.isArray(contents)) {
        this.cells[i][j][k] = _.without(contents, item);
      }
    },

    _put_item: function (item, i, j, k) {
      var row = this.cells[i];
      if (!row) {
        throw new Error('cannot find row ' + i);
      }
      var col = row[j];
      if (!col) {
        throw new Error('cannot find col ' + j);
      }

      var v = col[k];
      if (!v) {
        throw new Error('cannot find v ' + k);
      }

      v[k] = [item];
    },

    add_item: function (item, i, j, k, from_i, from_j, from_k) {
      var contents = this.contents(i, j, k);

      if (contents) {
        contents.push(item);
      } else {
        this._put_item(item, i, j, k);
      }

      if (arguments.length > 4) {
        this.remove_item(item, from_i, from_j, from_k);
      }

      this._node.add(item);
    },

    move_item: function (item, i, j, k, from_i, from_j, from_k) {
      var contents = this.contents(i, j, k);

      if (contents) {
        if (contents.length) {
          return; // can't move into occupied space;
        }
        contents.push(item);
      } else {
        this._put_item(item, i, j, k);
      }

      if (arguments.length > 4) {
        this.remove_item(item, from_i, from_j, from_k);
      }

      item.move_to(i, j, k);
    }

  });

  module.exports = World;
});