(function() {

  var FishTankRenderer = function() {};

  FishTankRenderer.prototype.init = function(container) {
    if (!FishTankRenderer.isWebGLEnabled()) {
      throw new Error('WebGL is not enabled in your browser.');
    }

    var mesh, geometry;

    this.spheres = [];
    this.cube;

    // this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
    // this.camera.position.z = 3200;
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.x = 0;
    //this.camera.position.y = 150;
    this.camera.position.z = 1000;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xfff0f0 );

    var geometry = new THREE.SphereGeometry(100, 32, 16);

    var path = 'assets/fish_tank/';
    var format = '.png';
    var urls = [
      path + 'px' + format, path + 'nx' + format,
      path + 'py' + format, path + 'ny' + format,
      path + 'pz' + format, path + 'nz' + format
    ];

    var textureCube = THREE.ImageUtils.loadTextureCube(urls);
    var material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      envMap: textureCube
    });

    // Skybox

    var shader = THREE.ShaderLib["cube"];
    shader.uniforms["tCube"].value = textureCube;

    // Cube
    var geometry = new THREE.BoxGeometry( 200, 200, 200 );
    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
      var hex = Math.random() * 0xffffff;
      geometry.faces[ i ].color.setHex( hex );
      geometry.faces[ i + 1 ].color.setHex( hex );
    }
    var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
    this.cube = new THREE.Mesh( geometry, material );
    this.cube.position.z = 150;
    this.scene.add( this.cube );

    var _params = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    };

    var width = window.innerWidth || 2;
    var height = window.innerHeight || 2;

    this.renderer = new THREE.WebGLRenderer(width, height, _params);
    container.appendChild(this.renderer.domElement);
    this.renderer.setSize(width, height);
  };

  FishTankRenderer.prototype.render = function(controlX, controlY) {

    controlX = Math.floor(controlX *0.025);
    controlY = Math.floor(controlY *0.025);

    this.cube.position.x += (-controlX - this.cube.position.x) * 0.05;
    this.cube.position.y += (-controlY - this.cube.position.y) * 0.05;
    //this.camera.position.x += (-controlX - this.camera.position.x) * 0.05;
    //this.camera.position.y += (-controlY - this.camera.position.y) * 0.05;
    console.log(controlX, controlY)
    console.log(this.camera.position.x,this.camera.position.y,this.camera.position.z);
    console.log(this.cube.position.x,this.cube.position.y,this.cube.position.z);
    //this.cube.position.y = this.camera.position.y+100;

    //this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  };

  FishTankRenderer.isWebGLEnabled = function() {
    try {
      var canvas = document.createElement('canvas');
      return !!window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  };

  window.FishTankRenderer = FishTankRenderer;

})();
