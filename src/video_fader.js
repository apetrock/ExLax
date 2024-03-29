import * as THREE from 'three';
import React, { useEffect, useRef, useState } from 'react';
import e from 'cors';

class VideoFader {
    time = 0;
    aspect = 1.0;
    target_fade = 0.0;
    current_fade = 0.0;
    fade_direction = 0;
    fade_duration = 1000;

    constructor() {

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.uniforms = {
            uTexture1: { value: null },
            uTexture2: { value: null },
            fade: { value: 0.0 }
        };
        this.then = 0;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Fetch clear color from component CSS
        const componentElement = document.querySelector('.VideoFaderComponent');
        const computedStyle = window.getComputedStyle(componentElement);
        const clearColor = computedStyle.backgroundColor;
        this.renderer.setClearColor(clearColor);
        //this.renderer.setClearColor(0x000000);


        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform sampler2D uTexture1;
            uniform sampler2D uTexture2;
            uniform float fade;
            varying vec2 vUv;
            void main() {
                vec4 color1 = texture2D(uTexture1, vUv);
                vec4 color2 = texture2D(uTexture2, vUv);
                //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                gl_FragColor = mix(color1, color2, fade);
            }
        `;
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov); // convert vertical fov to radians
        const height = 2 * Math.tan(vFOV / 2) * this.camera.position.z; // visible height
        const width = height * this.camera.aspect; // visible width

        const geometry = new THREE.PlaneGeometry(width, height);

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0); // Center the mesh
        this.scene.add(mesh);

        this.animate = this.animate.bind(this);

    }

    dispose() {
        if (this.videoTexture0)
            this.videoTexture0.dispose();
        if (this.videoTexture1)
            this.videoTexture1.dispose();
        this.renderer.dispose();
        cancelAnimationFrame(this.animate)
        //this.scene.dispose();
    }

    setVideoTexture(video, index) {
        let width = video.videoWidth;
        let height = video.videoHeight;
        this.setAspectRatio(width, height);

        let oldTexture;
        let newTexture = new THREE.VideoTexture(video);
        newTexture.minFilter = THREE.LinearFilter;
        newTexture.magFilter = THREE.LinearFilter;
        newTexture.format = THREE.RGBAFormat;
        newTexture.needsUpdate = true;

        if (index === 0) {
            oldTexture = this.videoTexture0;
            this.videoTexture0 = newTexture;
            this.uniforms.uTexture1.value = newTexture;
        } else {
            oldTexture = this.videoTexture1;
            this.videoTexture1 = newTexture;
            this.uniforms.uTexture2.value = newTexture;
        }

        if (oldTexture) {
            oldTexture.dispose();
        }
    }

    setGoalFade(target_fade, fade_duration) {
        this.target_fade = target_fade;
        this.fade_direction = target_fade > this.current_fade ? 1 : -1;
        this.fade_duration = fade_duration * 1000;
    }

    computeFade(interval) {
        let clamp = (t, a, b) => {
            return Math.max(Math.min(t, b), a);
        }
        let df = interval / this.fade_duration * this.fade_direction;
        this.current_fade = this.current_fade + df;
        //this.fade_direction = this.current_fade > 1.0 ? 0.0 : this.fade_direction;
        //this.fade_direction = this.current_fade < 0.0 ? 0.0 : this.fade_direction;
        this.current_fade = clamp(this.current_fade, 0.0, 1.0);
        this.setFade(this.current_fade);
    }

    setFade(t) {
        //console.log("setting fade: ", t);
        this.current_fade = t;
        this.uniforms.fade.value = t;
    }

    bindToCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        //document.body.appendChild(this.renderer.domElement );
        canvas.appendChild(this.renderer.domElement);
    }

    setAspectRatio(width, height) {
        this.aspect = width / height;
        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
        this.setWindowSize(window.innerWidth, window.innerHeight);
    }

    setWindowSize(width, height) {
        let twidth = height * this.aspect;
        let theight = width / this.aspect;
        if (twidth > width) {
            this.renderer.setSize(width, theight);
        } else {
            this.renderer.setSize(twidth, height);
        }
    }

    start() {
        if (this.animating) return;
        this.animate();
    }

    end() {
        if (!this.animating) return;
        cancelAnimationFrame(this.animating);
        this.animating = null;
    }

  
    animate(now) {
        const fps = 30; // Desired frames per second
        const interval = 1000 / fps; // Interval in milliseconds
        this.animating = requestAnimationFrame(this.animate);
        const delta = now - this.then;
        if (!now) return;
        this.computeFade(delta);
        if (delta > interval) {
            // Update time
            this.then = now - (delta % interval);
            this.renderer.render(this.scene, this.camera);
        }
    }

}

const VideoFaderComponent = ({ videoFader, textureRoute, fade }) => {
    const canvasRef = useRef(null);
    const videoFaderRef = useRef(null);

    useEffect(() => {
        if (!videoFader) return;
        videoFaderRef.current = videoFader;
        videoFaderRef.current.bindToCanvas(canvasRef.current);

        // Start the animation
        videoFaderRef.current.start();

        return () => {
            // Clean up resources
            videoFaderRef.current.dispose();
            videoFaderRef.current = null;
        };
    }, [videoFader]);

    return <div ref={canvasRef} className="VideoFaderComponent" />;
};

export default VideoFaderComponent;
export { VideoFader, VideoFaderComponent };