import React, { Component } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { TweenLite } from "gsap";

Number.prototype.map = function(in_min, in_max, out_min, out_max) {
  return ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

const rootStyles = { height: '100%', width: '100%', position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', zIndex: '-1', pointerEvents: 'none' }

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
class ImageDistort extends Component {
  constructor(props) {
    super(props);
    this.state = { isLoaded: false };
  }

  /**
   * Entrypoint us here.
   */
  componentDidMount() {
    if (!this.props.listRoot || !this.props.itemRoot) return;
    this.setup();
    this.listItems = this.getListItems({ selector: this.props.listRoot });
    this.initEffectShell({ items: this.listItems }).then(() => {
      this.setState({
        isLoaded: true
      });
    });
    this.createEventsListeners({ items: this.listItems });
    this.init();
  }

  get viewport() {
    let width = this.mount.clientWidth;
    let height = this.mount.clientHeight;
    let aspectRatio = width / height;
    return {
      width,
      height,
      aspectRatio
    };
  }

  get viewSize() {
    let distance = this.camera.position.z;
    let vFov = (this.camera.fov * Math.PI) / 180;
    let height = 2 * Math.tan(vFov / 2) * distance;
    let width = height * this.viewport.aspectRatio;
    return { width, height, vFov };
  }

  _onMouseLeave(event) {
    this.isMouseOver = false;
    this.onMouseLeave(event);
  }

  _onMouseMove(event) {
    // get normalized mouse position on viewport
    this.mouse.x = (event.clientX / this.mount.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.mount.clientHeight) * 2 + 1;

    this.onMouseMove(event);
  }

  _onMouseOver(index, event) {
    this.onMouseOver(index, event);
  }

  onMouseLeave(event) {
    TweenLite.to(this.uniforms.uAlpha, 0.5, {
      value: 0,
      ease: Power4.easeOut
    });
  }

  onMouseMove(event) {
    // project mouse position to world coordinates using the new Number.Prototype.map we create in the top
    let x = this.mouse.x.map(
      -1,
      1,
      -this.viewSize.width / 2,
      this.viewSize.width / 2
    );
    let y = this.mouse.y.map(
      -1,
      1,
      -this.viewSize.height / 2,
      this.viewSize.height / 2
    );
    // update plane position
    this.position = new THREE.Vector3(x, y, 0);
    TweenLite.to(this.mesh.position, 1, {
      x: x,
      y: y,
      ease: Power4.easeOut,
      onUpdate: this.onPositionUpdate.bind(this)
    });
  }

  onMouseOver(index, e) {
    if (!this.state.isLoaded) return;
    this.onMouseEnter();
    if (this.currentItem && this.currentItem.index === index) return;
    this.onTargetChange(index);
  }

  onMouseEnter() {
    if (!this.currentItem || !this.isMouseOver) {
      this.isMouseOver = true;
      // show plane
      TweenLite.to(this.uniforms.uAlpha, 0.5, {
        value: 1,
        ease: Power4.easeOut
      });
    }
  }

  onPositionUpdate() {
    // compute offset
    let offset = this.mesh.position
      .clone()
      .sub(this.position) // velocity
      .multiplyScalar(-this.props.options.strength);
    this.uniforms.uOffset.value = offset;
  }

  onTargetChange(index) {
    // item target changed
    this.currentItem = this.listItems[index];
    if (!this.currentItem.texture) return;

    //update texture
    this.uniforms.uTexture.value = this.currentItem.texture;

    // compute image ratio
    let imageRatio =
      this.currentItem.img.naturalWidth / this.currentItem.img.naturalHeight;

    // scale plane to fit image dimensions
    this.scale = new THREE.Vector3(imageRatio, 1, 1);
    this.mesh.scale.copy(this.scale);
  }

  componentWillUnmount() {
    this.stop();
    this.mount.removeChild(this.renderer.domElement);
  }

  setup() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
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

    if (typeof window !== `undefined`) {
      window.addEventListener("resize", this.onWindowResize, false);
      window.addEventListener("mousemove", this.mouseMove);
    }
  }

  getShader() {
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
    const defaultShader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform vec2 uOffset;
        varying vec2 vUv;

        #define M_PI 3.1415926535897932384626433832795

        vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {
          position.x = position.x + (sin(uv.y * M_PI) * offset.x);
          position.y = position.y + (sin(uv.x * M_PI) * offset.y);
          return position;
        }

        void main() {
          vUv = uv;
          vec3 newPosition = deformationCurve(position, uv, uOffset);
          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uAlpha;
        varying vec2 vUv;

        void main() {
          vec3 color = texture2D(uTexture,vUv).rgb;
          gl_FragColor = vec4(color,uAlpha);
        }
      `,
      transparent: true
    });
    const redshiftShader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform vec2 uOffset;
        varying vec2 vUv;

        #define M_PI 3.1415926535897932384626433832795

        vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {
          position.x = position.x + (sin(uv.y * M_PI) * offset.x);
          position.y = position.y + (sin(uv.x * M_PI) * offset.y);
          return position;
        }

        void main() {
          vUv = uv;
          vec3 newPosition = deformationCurve(position, uv, uOffset);
          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uAlpha;
        uniform vec2 uOffset;

        varying vec2 vUv;

        vec3 rgbShift(sampler2D texture, vec2 uv, vec2 offset) {
          float r = texture2D(uTexture,vUv + uOffset).r;
          vec2 gb = texture2D(uTexture,vUv).gb;
          return vec3(r,gb);
        }

        void main() {
          vec3 color = rgbShift(uTexture,vUv,uOffset);
          gl_FragColor = vec4(color,uAlpha);
        }
        `,
      transparent: true
    });
    const stretchyShader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform vec2 uOffset;

        varying vec2 vUv;

        vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {
          float M_PI = 3.1415926535897932384626433832795;
          position.x = position.x + (sin(uv.y * M_PI) * offset.x);
          position.y = position.y + (sin(uv.x * M_PI) * offset.y);
          return position;
        }

        void main() {
          vUv =  uv + (uOffset * 2.);
          vec3 newPosition = position;
          newPosition = deformationCurve(position,uv,uOffset);
          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uAlpha;

        varying vec2 vUv;

        // zoom on texture 
        vec2 scaleUV(vec2 uv,float scale) {
          float center = 0.5;
          return ((uv - center) * scale) + center;
        }

        void main() {
          vec3 color = texture2D(uTexture,scaleUV(vUv,0.8)).rgb;
          gl_FragColor = vec4(color,uAlpha);
        }
      `,
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

  getGeometry() {
    const {
      shape = "circle",
      radius = 0.6,
      segments = 64,
      width = 1,
      height = 1,
      segmentsWidth = 32,
      segmentsHeight = 32
    } = this.props.options
      ? this.props.options.geometry
        ? this.props.options.geometry
        : {}
      : {};

    switch (shape) {
      case "":
        return new THREE.CircleBufferGeometry(radius, segments);
      case "circle":
        return new THREE.CircleBufferGeometry(radius, segments);
      case "plane":
        return new THREE.PlaneBufferGeometry(
          width,
          height,
          segmentsWidth,
          segmentsHeight
        );
      default:
        return new THREE.CircleBufferGeometry(radius, segments);
    }
  }

  init() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.scale = new THREE.Vector3(1, 1, 1);
    this.geometry = this.getGeometry();
    this.material = this.getShader();
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  start() {
    this.renderer.setAnimationLoop(this.animate.bind(this));
  };

  stop() {
    cancelAnimationFrame(this.frameId);
  };

  animate() {
    this.renderer && this.renderer.render(this.scene, this.camera);
  };

  /**
   * @param  {Object} object
   * @param  {string} object.selector
   * @return {Object[]}
   */
  getListItems({ selector }) {
    this.listWrapper = document.querySelector(selector);
    const listItems = this.listWrapper
      ? [...this.listWrapper.querySelectorAll(this.props.itemRoot)]
      : [];

    return listItems.map((item, index) => ({
      element: item,
      img: item.querySelector("img") || null,
      index: index
    }));
  }

  /**
   * Sets a texture property on each of the list items.
   * @param {Object} object
   * @param {Object[]} object.items
   * @return {Promise<any>} returns a promise
   */
  initEffectShell({ items }) {
    let promises = [];

    const THREEtextureLoader = new THREE.TextureLoader();
    items.forEach((item, index) => {
      // create textures, returns a promise
      promises.push(
        this.loadTexture(
          THREEtextureLoader,
          item.img ? item.img.src : null,
          index
        )
      );
    });

    return new Promise((resolve, reject) => {
      // Promise.all returns a single promise which resolves when all promises of the parameter have been fulfilled
      Promise.all(promises).then(promises => {
        promises.forEach((promise, index) => {
          items[index].texture = promise.texture;
        });
        resolve();
      });
    });
  }

  /**
   * @return {promise<any>} returns a promise with resolve({ texture, index})
   */
  loadTexture(loader, url, index) {
    return new Promise((resolve, reject) => {
      if (!url) {
        resolve({ texture: null, index });
        return;
      }
      // load a resource { resource url: url, onLoadCallBack: func, onProgressCallBack: func, onErrorCallBack: func}
      loader.load(
        url,
        texture => {
          resolve({ texture, index });
        },
        undefined,
        error => {
          console.error("An error happened.", error);
          reject(error);
        }
      );
    });
  }

  createEventsListeners({ items }) {
    items.forEach((item, index) => {
      item.element.addEventListener(
        "mouseover",
        this._onMouseOver.bind(this, index),
        false
      );
    });

    this.listWrapper.addEventListener(
      "mousemove",
      this._onMouseMove.bind(this),
      false
    );

    this.listWrapper.addEventListener(
      "mouseleave",
      this._onMouseLeave.bind(this),
      false
    );
  }

  onWindowResize() {
    //changes the size of the canavs and updates it
    if (typeof window !== `undefined`) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  render() {
    return (
      <div
        style={rootStyles}
        ref={mount => {
          this.mount = mount;
        }}
      ></div>
    );
  }
}

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
  listRoot: PropTypes.string.isRequired,
  itemRoot: PropTypes.string.isRequired,
  options: PropTypes.shape({
    strength: PropTypes.number,
    effect: PropTypes.oneOf(["redshift", "stretch", ""]),
    geometry: PropTypes.shape({
      shape: PropTypes.oneOf(["circle", "plane", ""]),
      radius: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      segments: PropTypes.number,
      segmentsWidth: PropTypes.number,
      segmentsHeight: PropTypes.number
    }),
    scale: PropTypes.number
  })
};

export default ImageDistort;
