import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {WebGLRenderer} from 'three';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment';
import GUI from 'lil-gui';

import {NgbCarouselConfig, NgbModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [NgbCarouselConfig],
})
export class HomeComponent implements OnInit, AfterViewInit {
  showTip = true;

  closeTip() {
    this.showTip = false;
  }

  @ViewChild('canvas') private canvasRef?: ElementRef;
  @ViewChild('photo') photoModal: any;
  @ViewChild('video') videoModal: any;

  images = [
    "RLA1705_Year01_Flat_Small.jpg",
    "RLA1705_Year08_Flat_Small.jpg",
    "RLA1705_Year16_Flat_Small.jpg",
    "RLA1705_YearFinal_Flat_Small.jpg"
  ].map((n) => `assets/media/${n}`);

  @Input() public fieldOfView: number = 75;

  @Input('nearClipping') public nearClippingPane: number = 1;

  @Input('farClipping') public farClippingPane: number = 100000;

  private camera?: THREE.PerspectiveCamera;

  private controls?: OrbitControls;

  // private model: any;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  private loaderGLTF = new GLTFLoader();

  private rayCaster = new THREE.Raycaster();

  private pointer = new THREE.Vector2();

  private pinGroup = new THREE.Group();

  private renderer?: THREE.WebGLRenderer;

  private scene?: THREE.Scene;

  private createControls = () => {
    if (this.camera && this.renderer) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);

      this.controls.target.set(0, 0, 0);
      this.controls.autoRotate = true;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;

      this.controls.update();
    }
  };

  private createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      this.getAspectRatio(),
      this.nearClippingPane,
      this.farClippingPane
    )
    this.camera.position.x = 0;
    this.camera.position.y = 1000;
    this.camera.position.z = 0;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfe3dd);

    if (this.renderer instanceof WebGLRenderer) {
      const pmRemGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmRemGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('js/libs/draco/gltf/');

    this.loaderGLTF.setDRACOLoader(dracoLoader);
    this.loadGLTF('assets/3d-assets/Terrain_Outer.gltf', 'outer');

    this.loadPreMiningStage();

  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }


  private startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    const pmRemGenerator = new THREE.PMREMGenerator(this.renderer);
    if (this.scene) {
      this.scene.environment = pmRemGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    }

    let component: HomeComponent = this;
    (function render() {
      if (!component.scene || !component.camera) {
        return;
      }
      component.renderer?.render(component.scene, component.camera);
      // component.animateModel();
      requestAnimationFrame(render);
    }());
  }

  constructor(private modalService: NgbModal) {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.createScene();
    this.createCamera();
    this.startRenderingLoop();
    this.createControls();
    this.createGUI();
    this.setupPin();
  }

  private loadGLTF(url: string, name: string) {
    this.loaderGLTF.load(url, (gltf: GLTF) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(0.1, 0.1, 0.1);
      model.name = name;
      this.scene?.add(model);
    });
  }

  private loadPreMiningStage() {
    this.clearScene();
    this.loadGLTF('assets/3d-assets/Terrain_Existing.gltf', 'existing');
  }

  private loadMiningStage() {
    this.clearScene();
    this.loadGLTF('assets/3d-assets/Terrain_Year16.gltf', 'year16');
    this.loadGLTF('assets/3d-assets/Mining_Facilities.gltf', 'facilities');
  }

  private clearScene() {
    if (!this.scene) {
      return;
    }

    const removeList = ['existing', 'year16', 'facilities'];
    for (let name of removeList) {
      let found = this.scene.children.find(item => item.name == name);
      if (found) {
        this.scene.remove(found);
      }
    }
  }

  private createGUI() {
    const gui = new GUI();
    const that = this;
    const myObject = {
      preMiningStage: function () {
        that.loadPreMiningStage();
      },
      miningStage: function () {
        that.loadMiningStage();
      },
    };

    gui.add(myObject, 'preMiningStage'); // Button
    gui.add(myObject, 'miningStage'); // Button

  }

  private static createSprite(name: string, x: number, y: number, z: number) {
    const pin = new THREE.TextureLoader().load('assets/ui/Pin.svg');
    const marker = new THREE.SpriteMaterial({map: pin});
    const sprite = new THREE.Sprite(marker);
    sprite.scale.set(50, 50, 50);

    sprite.position.set(x, y, z);
    sprite.name = name;
    return sprite;
  }

  public onClick(event: any) {
    if (!this.camera || !this.scene) {
      return;
    }

    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.rayCaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.rayCaster.intersectObjects(this.scene.children, true);
    if (intersects.length == 0) {
      return;
    }
    const found = intersects.find(item => item.object.type == "Sprite");
    if (!found) {
      return;
    }
    this.openModal(found.object.name);
  }

  openModal(name: string) {
    switch (name) {
      case "pinA":
        this.modalService.open(this.photoModal, {size: 'lg'});
        break;
      case "pinB":
        this.modalService.open(this.videoModal, {size: 'lg'});
        break;
    }
  }

  private setupPin() {
    this.pinGroup.name = "pinGroup"
    this.pinGroup.add(HomeComponent.createSprite("pinA", 100, 200, 10));
    this.pinGroup.add(HomeComponent.createSprite("pinB", -100, 200, 50));

    this.scene?.add(this.pinGroup);
  }
}
