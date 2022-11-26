import {AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild} from '@angular/core';
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

  private controlPanelRef?: GUI;

  // private model: any;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  private loaderGLTF = new GLTFLoader();

  private rayCaster = new THREE.Raycaster();

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
    this.camera.position.y = 10000;
    this.camera.position.z = 0;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  private async createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfe3dd);

    if (this.renderer instanceof WebGLRenderer) {
      const pmRemGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmRemGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('js/libs/draco/gltf/');

    this.loaderGLTF.setDRACOLoader(dracoLoader);
    await this.loadGLTF('assets/3d-assets/Terrain_Outer.gltf', 'outer');
    await this.loadPreMiningStage();

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

  ngOnDestroy(): void {
    this.removeControlPanel();
  }

  ngAfterViewInit() {
    this.setupMap().then(r => {
    });
  }

  private async setupMap() {
    await this.createScene();
    this.createCamera();
    this.startRenderingLoop();
    this.createControls();
    this.createControlPanel();
    this.setupPin();
  }

  private loadGLTF(url: string, name: string) {
    let that = this;
    return new Promise((res) => {
      that.loaderGLTF.load(url, (gltf: GLTF) => {
        const model = gltf.scene;
        // model.position.set(0, 0, 0);
        // model.scale.set(0.1, 0.1, 0.1);
        model.name = name;
        that.scene?.add(model);
        res(name);
      });
    });
  }

  private async loadPreMiningStage() {
    this.clearScene();
    await this.loadGLTF('assets/3d-assets/Terrain_Existing.gltf', 'existing');
  }

  private async loadMiningStage() {
    this.clearScene();
    await this.loadGLTF('assets/3d-assets/Terrain_Year16.gltf', 'year16');
    await this.loadGLTF('assets/3d-assets/Mining_Facilities.gltf', 'facilities');
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

  private createControlPanel() {
    this.controlPanelRef = new GUI();
    let that = this;
    const myObject = {
      // preMiningStage: this.loadPreMiningStage, // TODO: why not work??
      // miningStage: this.loadMiningStage,
      preMiningStage: function () {
        that.loadPreMiningStage().then();
      },
      miningStage: function () {
        that.loadMiningStage().then();
      },
    };

    this.controlPanelRef.add(myObject, 'preMiningStage');
    this.controlPanelRef.add(myObject, 'miningStage');

  }

  private removeControlPanel() {
    this.controlPanelRef?.destroy();
  }

  private static createSprite(name: string, x: number, y: number, z: number) {
    const pin = new THREE.TextureLoader().load('assets/ui/Pin.svg');
    const marker = new THREE.SpriteMaterial({map: pin});
    const sprite = new THREE.Sprite(marker);
    sprite.scale.set(200, 200, 200);

    sprite.position.set(x, y, z);
    sprite.name = name;
    return sprite;
  }

  private findIntersects(x: number, y: number) {
    if (!this.camera || !this.scene) {
      return [];
    }
    let canvasWidth = this.canvasRef?.nativeElement.offsetWidth;
    let canvasHeight = this.canvasRef?.nativeElement.offsetHeight;

    let pointer = new THREE.Vector2();

    pointer.x = (x / canvasWidth) * 2 - 1;
    pointer.y = -(y / canvasHeight) * 2 + 1;

    this.rayCaster.setFromCamera(pointer, this.camera);
    let list = this.rayCaster.intersectObjects(this.scene.children, true);
    return list
  }

  public onClick(event: any) {
    const intersects = this.findIntersects(event.clientX, event.clientY);
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
    const pointA = this.findPinOnTerrain(800, 400)
    if (pointA != null) {
      this.pinGroup.add(HomeComponent.createSprite("pinA", pointA.x, pointA.y + 100, pointA.z));
    }

    const pointB = this.findPinOnTerrain(700, 500)
    if (pointB != null) {
      this.pinGroup.add(HomeComponent.createSprite("pinB", pointB.x, pointB.y + 100, pointB.z));
    }

    this.scene?.add(this.pinGroup);
  }

  private findPinOnTerrain(x: number, y: number) {
    if (!this.scene || !this.camera) {
      return null;
    }

    const list = this.findIntersects(x, y);
    if (list.length == 0) {
      return null;
    }
    let found = list.find(item => {
      return item.object.name.startsWith("Terrain")
    });
    if (!found) {
      return null;
    }
    return found.point;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: { innerWidth: any; }; }) {
    if (!this.camera || !this.renderer) {
      return;
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer?.setSize(window.innerWidth, window.innerHeight);
  }
}
