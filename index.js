"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _three = require("three");

var THREE = _interopRequireWildcard(_three);

var _gsap = require("gsap");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

var rootStyles = { height: '100%', width: '100%', position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', zIndex: '-1', pointerEvents: 'none'

  /**
   * @prop {string} itemRoot selector for the toplevel list item which holds the image
   * @prop {string} listRoot Wrapper for the listItems in the shape of a css class selector.
   * @prop {Object} [options]
   * @prop {Number} [options.strength=0.25] How powerful the distort is
   * @prop {String} [options.effect=''] A string defining what extra effect to apply. Defaults to "redshift", can also pass "stretch"
   * @prop {Object} [options.geometry] Object containing all options regarding the shape that holds the image
   * @prop {String} [options.geometry.shape='circle'] A string defining the shape of the geometry. Defaults to "circle", can also pass "plane". If circle then the image should be square.
   * @prop {Number} [options.geometry.radius=0.6] A number defining the radius(size) of the shape. Only applicable when shape is 'circle'
   * @prop {Number} [options.geometry.segments=64] Defines the number of segments of the shape when the shape is 'circle
   * @prop {Number} [options.geometry.width=1] Defines the width of the shape when the shape is 'plane'
   * @prop {Number} [options.geometry.height=1] Defines the height of the shape when the shape is 'plane'
   * @prop {Number} [options.geometry.segmentsWidth=32] Defines the number of segments on the X-axis of the shape when the shape is 'plane'
   * @prop {Number} [options.geometry.segmentsHeight=32] Defines the number of segments on the Y-axis of the shape when the shape is 'plane'
   */
};
var ImageDistort = function (_Component) {
  _inherits(ImageDistort, _Component);

  function ImageDistort(props) {
    _classCallCheck(this, ImageDistort);

    var _this = _possibleConstructorReturn(this, (ImageDistort.__proto__ || Object.getPrototypeOf(ImageDistort)).call(this, props));

    _this.state = { isLoaded: false };
    return _this;
  }

  /**
   * Entrypoint us here.
   */


  _createClass(ImageDistort, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      if (!this.props.listRoot || !this.props.itemRoot) return;
      this.setup();
      this.listItems = this.getListItems({ selector: this.props.listRoot });
      this.initEffectShell({ items: this.listItems }).then(function () {
        _this2.setState({
          isLoaded: true
        });
      });
      this.createEventsListeners({ items: this.listItems });
      this.init();
    }
  }, {
    key: "_onMouseLeave",
    value: function _onMouseLeave(event) {
      this.isMouseOver = false;
      this.onMouseLeave(event);
    }
  }, {
    key: "_onMouseMove",
    value: function _onMouseMove(event) {
      // get normalized mouse position on viewport
      this.mouse.x = event.clientX / this.mount.clientWidth * 2 - 1;
      this.mouse.y = -(event.clientY / this.mount.clientHeight) * 2 + 1;

      this.onMouseMove(event);
    }
  }, {
    key: "_onMouseOver",
    value: function _onMouseOver(index, event) {
      this.onMouseOver(index, event);
    }
  }, {
    key: "onMouseLeave",
    value: function onMouseLeave(event) {
      _gsap.TweenLite.to(this.uniforms.uAlpha, 0.5, {
        value: 0,
        ease: Power4.easeOut
      });
    }
  }, {
    key: "onMouseMove",
    value: function onMouseMove(event) {
      // project mouse position to world coordinates using the new Number.Prototype.map we create in the top
      var x = this.mouse.x.map(-1, 1, -this.viewSize.width / 2, this.viewSize.width / 2);
      var y = this.mouse.y.map(-1, 1, -this.viewSize.height / 2, this.viewSize.height / 2);
      // update plane position
      this.position = new THREE.Vector3(x, y, 0);
      _gsap.TweenLite.to(this.mesh.position, 1, {
        x: x,
        y: y,
        ease: Power4.easeOut,
        onUpdate: this.onPositionUpdate.bind(this)
      });
    }
  }, {
    key: "onMouseOver",
    value: function onMouseOver(index, e) {
      if (!this.state.isLoaded) return;
      this.onMouseEnter();
      if (this.currentItem && this.currentItem.index === index) return;
      this.onTargetChange(index);
    }
  }, {
    key: "onMouseEnter",
    value: function onMouseEnter() {
      if (!this.currentItem || !this.isMouseOver) {
        this.isMouseOver = true;
        // show plane
        _gsap.TweenLite.to(this.uniforms.uAlpha, 0.5, {
          value: 1,
          ease: Power4.easeOut
        });
      }
    }
  }, {
    key: "onPositionUpdate",
    value: function onPositionUpdate() {
      // compute offset
      var offset = this.mesh.position.clone().sub(this.position) // velocity
      .multiplyScalar(-this.props.options.strength);
      this.uniforms.uOffset.value = offset;
    }
  }, {
    key: "onTargetChange",
    value: function onTargetChange(index) {
      // item target changed
      this.currentItem = this.listItems[index];
      if (!this.currentItem.texture) return;

      //update texture
      this.uniforms.uTexture.value = this.currentItem.texture;

      // compute image ratio
      var imageRatio = this.currentItem.img.naturalWidth / this.currentItem.img.naturalHeight;

      // scale plane to fit image dimensions
      this.scale = new THREE.Vector3(imageRatio, 1, 1);
      this.mesh.scale.copy(this.scale);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.stop();
      this.mount.removeChild(this.renderer.domElement);
    }
  }, {
    key: "setup",
    value: function setup() {
      var width = this.mount.clientWidth;
      var height = this.mount.clientHeight;
      this.speed = 0;
      this.mouse = { x: 0, y: 0 };

      //ADD SCENE
      this.scene = new THREE.Scene();

      //ADD CAMERA
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 3);

      //ADD RENDERER
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setSize(width, height);
      this.mount.appendChild(this.renderer.domElement);

      this.start();

      if (typeof window !== "undefined") {
        window.addEventListener("resize", this.onWindowResize, false);
        window.addEventListener("mousemove", this.mouseMove);
      }
    }
  }, {
    key: "getShader",
    value: function getShader() {
      this.uniforms = {
        uTexture: {
          //texture data
          value: null
        },
        uOffset: {
          //distortion strength
          value: new THREE.Vector2(0.0, 0.0)
        },
        uAlpha: {
          //opacity
          value: 0
        }
      };
      var defaultShader = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: "\n        uniform vec2 uOffset;\n        varying vec2 vUv;\n\n        #define M_PI 3.1415926535897932384626433832795\n\n        vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {\n          position.x = position.x + (sin(uv.y * M_PI) * offset.x);\n          position.y = position.y + (sin(uv.x * M_PI) * offset.y);\n          return position;\n        }\n\n        void main() {\n          vUv = uv;\n          vec3 newPosition = deformationCurve(position, uv, uOffset);\n          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n        }\n      ",
        fragmentShader: "\n        uniform sampler2D uTexture;\n        uniform float uAlpha;\n        varying vec2 vUv;\n\n        void main() {\n          vec3 color = texture2D(uTexture,vUv).rgb;\n          gl_FragColor = vec4(color,uAlpha);\n        }\n      ",
        transparent: true
      });
      var redshiftShader = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: "\n        uniform vec2 uOffset;\n        varying vec2 vUv;\n\n        #define M_PI 3.1415926535897932384626433832795\n\n        vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {\n          position.x = position.x + (sin(uv.y * M_PI) * offset.x);\n          position.y = position.y + (sin(uv.x * M_PI) * offset.y);\n          return position;\n        }\n\n        void main() {\n          vUv = uv;\n          vec3 newPosition = deformationCurve(position, uv, uOffset);\n          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n        }\n      ",
        fragmentShader: "\n        uniform sampler2D uTexture;\n        uniform float uAlpha;\n        uniform vec2 uOffset;\n\n        varying vec2 vUv;\n\n        vec3 rgbShift(sampler2D texture, vec2 uv, vec2 offset) {\n          float r = texture2D(uTexture,vUv + uOffset).r;\n          vec2 gb = texture2D(uTexture,vUv).gb;\n          return vec3(r,gb);\n        }\n\n        void main() {\n          vec3 color = rgbShift(uTexture,vUv,uOffset);\n          gl_FragColor = vec4(color,uAlpha);\n        }\n        ",
        transparent: true
      });
      var stretchyShader = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: "\n        uniform vec2 uOffset;\n\n        varying vec2 vUv;\n\n        vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {\n          float M_PI = 3.1415926535897932384626433832795;\n          position.x = position.x + (sin(uv.y * M_PI) * offset.x);\n          position.y = position.y + (sin(uv.x * M_PI) * offset.y);\n          return position;\n        }\n\n        void main() {\n          vUv =  uv + (uOffset * 2.);\n          vec3 newPosition = position;\n          newPosition = deformationCurve(position,uv,uOffset);\n          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n        }\n      ",
        fragmentShader: "\n        uniform sampler2D uTexture;\n        uniform float uAlpha;\n\n        varying vec2 vUv;\n\n        // zoom on texture \n        vec2 scaleUV(vec2 uv,float scale) {\n          float center = 0.5;\n          return ((uv - center) * scale) + center;\n        }\n\n        void main() {\n          vec3 color = texture2D(uTexture,scaleUV(vUv,0.8)).rgb;\n          gl_FragColor = vec4(color,uAlpha);\n        }\n      ",
        transparent: true
      });

      switch (this.props.options.effect) {
        case "":
          return defaultShader;
        case "redshift":
          return redshiftShader;
        case "stretch":
          return stretchyShader;
        default:
          return defaultShader;
      }
    }
  }, {
    key: "getGeometry",
    value: function getGeometry() {
      var _ref = this.props.options ? this.props.options.geometry ? this.props.options.geometry : {} : {},
          _ref$shape = _ref.shape,
          shape = _ref$shape === undefined ? "circle" : _ref$shape,
          _ref$radius = _ref.radius,
          radius = _ref$radius === undefined ? 0.6 : _ref$radius,
          _ref$segments = _ref.segments,
          segments = _ref$segments === undefined ? 64 : _ref$segments,
          _ref$width = _ref.width,
          width = _ref$width === undefined ? 1 : _ref$width,
          _ref$height = _ref.height,
          height = _ref$height === undefined ? 1 : _ref$height,
          _ref$segmentsWidth = _ref.segmentsWidth,
          segmentsWidth = _ref$segmentsWidth === undefined ? 32 : _ref$segmentsWidth,
          _ref$segmentsHeight = _ref.segmentsHeight,
          segmentsHeight = _ref$segmentsHeight === undefined ? 32 : _ref$segmentsHeight;

      switch (shape) {
        case "":
          return new THREE.CircleBufferGeometry(radius, segments);
        case "circle":
          return new THREE.CircleBufferGeometry(radius, segments);
        case "plane":
          return new THREE.PlaneBufferGeometry(width, height, segmentsWidth, segmentsHeight);
        default:
          return new THREE.CircleBufferGeometry(radius, segments);
      }
    }
  }, {
    key: "init",
    value: function init() {
      this.position = new THREE.Vector3(0, 0, 0);
      this.scale = new THREE.Vector3(1, 1, 1);
      this.geometry = this.getGeometry();
      this.material = this.getShader();
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.mesh);
    }
  }, {
    key: "start",
    value: function start() {
      this.renderer.setAnimationLoop(this.animate.bind(this));
    }
  }, {
    key: "stop",
    value: function stop() {
      cancelAnimationFrame(this.frameId);
    }
  }, {
    key: "animate",
    value: function animate() {
      this.renderer && this.renderer.render(this.scene, this.camera);
    }
  }, {
    key: "getListItems",


    /**
     * @param  {Object} object
     * @param  {string} object.selector
     * @return {Object[]}
     */
    value: function getListItems(_ref2) {
      var selector = _ref2.selector;

      this.listWrapper = document.querySelector(selector);
      var listItems = this.listWrapper ? [].concat(_toConsumableArray(this.listWrapper.querySelectorAll(this.props.itemRoot))) : [];

      return listItems.map(function (item, index) {
        return {
          element: item,
          img: item.querySelector("img") || null,
          index: index
        };
      });
    }

    /**
     * Sets a texture property on each of the list items.
     * @param {Object} object
     * @param {Object[]} object.items
     * @return {Promise<any>} returns a promise
     */

  }, {
    key: "initEffectShell",
    value: function initEffectShell(_ref3) {
      var _this3 = this;

      var items = _ref3.items;

      var promises = [];

      var THREEtextureLoader = new THREE.TextureLoader();
      items.forEach(function (item, index) {
        // create textures, returns a promise
        promises.push(_this3.loadTexture(THREEtextureLoader, item.img ? item.img.src : null, index));
      });

      return new Promise(function (resolve, reject) {
        // Promise.all returns a single promise which resolves when all promises of the parameter have been fulfilled
        Promise.all(promises).then(function (promises) {
          promises.forEach(function (promise, index) {
            items[index].texture = promise.texture;
          });
          resolve();
        });
      });
    }

    /**
     * @return {promise<any>} returns a promise with resolve({ texture, index})
     */

  }, {
    key: "loadTexture",
    value: function loadTexture(loader, url, index) {
      return new Promise(function (resolve, reject) {
        if (!url) {
          resolve({ texture: null, index: index });
          return;
        }
        // load a resource { resource url: url, onLoadCallBack: func, onProgressCallBack: func, onErrorCallBack: func}
        loader.load(url, function (texture) {
          resolve({ texture: texture, index: index });
        }, undefined, function (error) {
          console.error("An error happened.", error);
          reject(error);
        });
      });
    }
  }, {
    key: "createEventsListeners",
    value: function createEventsListeners(_ref4) {
      var _this4 = this;

      var items = _ref4.items;

      items.forEach(function (item, index) {
        item.element.addEventListener("mouseover", _this4._onMouseOver.bind(_this4, index), false);
      });

      this.listWrapper.addEventListener("mousemove", this._onMouseMove.bind(this), false);

      this.listWrapper.addEventListener("mouseleave", this._onMouseLeave.bind(this), false);
    }
  }, {
    key: "onWindowResize",
    value: function onWindowResize() {
      //changes the size of the canavs and updates it
      if (typeof window !== "undefined") {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this5 = this;

      return _react2.default.createElement("div", {
        style: rootStyles,
        ref: function ref(mount) {
          _this5.mount = mount;
        }
      });
    }
  }, {
    key: "viewport",
    get: function get() {
      var width = this.mount.clientWidth;
      var height = this.mount.clientHeight;
      var aspectRatio = width / height;
      return {
        width: width,
        height: height,
        aspectRatio: aspectRatio
      };
    }
  }, {
    key: "viewSize",
    get: function get() {
      var distance = this.camera.position.z;
      var vFov = this.camera.fov * Math.PI / 180;
      var height = 2 * Math.tan(vFov / 2) * distance;
      var width = height * this.viewport.aspectRatio;
      return { width: width, height: height, vFov: vFov };
    }
  }]);

  return ImageDistort;
}(_react.Component);

ImageDistort.defaultProps = {
  listRoot: "document.body",
  itemRoot: "a",
  options: {
    strength: 0.25,
    effect: "",
    geometry: {
      shape: "circle",
      radius: 0.5,
      width: 0.7,
      height: 0.7,
      segments: 64,
      segmentsWidth: 32,
      segmentsHeight: 32
    }
  }
};

ImageDistort.propTypes = {
  listRoot: _propTypes2.default.string.isRequired,
  itemRoot: _propTypes2.default.string.isRequired,
  options: _propTypes2.default.shape({
    strength: _propTypes2.default.number,
    effect: _propTypes2.default.oneOf(["redshift", "stretch", ""]),
    geometry: _propTypes2.default.shape({
      shape: _propTypes2.default.oneOf(["circle", "plane", ""]),
      radius: _propTypes2.default.number,
      width: _propTypes2.default.number,
      height: _propTypes2.default.number,
      segments: _propTypes2.default.number,
      segmentsWidth: _propTypes2.default.number,
      segmentsHeight: _propTypes2.default.number
    }),
    scale: _propTypes2.default.number
  })
};

exports.default = ImageDistort;