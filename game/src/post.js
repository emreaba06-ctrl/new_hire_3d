/* =====================================================================
   POST-PROCESSING: ambient occlusion (soft contact shadows), bloom and
   a film-style color grade. Levels follow the graphics setting:
     Performance → none · HD → bloom + grade · Ultra/4K → AO + bloom + grade
   Settings → "Visual effects" can force them off.
   ===================================================================== */
const POST = { composer: null, ssao: null, bloom: null, grade: null, mode: "" };
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uContrast: { value: 1.08 }, uSat: { value: 1.1 }, uWarm: { value: .04 }, uVig: { value: .32 }, uLift: { value: .012 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uContrast, uSat, uWarm, uVig, uLift; varying vec2 vUv;
    vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }
    void main(){
      vec4 t = texture2D(tDiffuse, vUv); vec3 c = toSRGB(max(t.rgb, 0.0));
      c = (c - 0.5) * uContrast + 0.5 + uLift;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(l), c, uSat);
      c += vec3(uWarm, uWarm * 0.35, -uWarm * 0.6) * (1.0 - l);
      vec2 d = vUv - 0.5; c *= 1.0 - uVig * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`
};
function postLevel() {
  if (!THREE.EffectComposer || (S.fx || "auto") === "off") return 0;
  const g = S.gfx || "hd"; return g === "perf" ? 0 : g === "hd" ? 1 : 2;
}
function setupPost() {
  if (POST.composer) { POST.composer.renderTarget1.dispose(); POST.composer.renderTarget2.dispose(); POST.composer = null; }
  POST.mode = ""; const lvl = postLevel(); if (!lvl || !E.renderer) return;
  try {
    const r = E.renderer, size = r.getSize(new THREE.Vector2()), pr = r.getPixelRatio();
    const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    const rt = r.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(size.x * pr, size.y * pr, rtOpts) : new THREE.WebGLRenderTarget(size.x * pr, size.y * pr, rtOpts);
    if (rt.samples !== undefined) rt.samples = 4;
    const comp = new THREE.EffectComposer(r, rt); comp.setPixelRatio(pr); comp.setSize(size.x, size.y);
    if (lvl >= 2 && THREE.SSAOPass && S.fx === "ao") {
      const s = new THREE.SSAOPass(E.scene, E.camera, size.x, size.y);
      s.kernelRadius = .8; s.minDistance = .0004; s.maxDistance = .04; s.normalMaterial.skinning = true;
      comp.addPass(s); POST.ssao = s;
    } else { comp.addPass(new THREE.RenderPass(E.scene, E.camera)); POST.ssao = null; }
    const b = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), lvl >= 2 ? .32 : .25, .55, .88); comp.addPass(b); POST.bloom = b;
    const g = new THREE.ShaderPass(GradeShader); comp.addPass(g); POST.grade = g;
    if (!rt.samples && THREE.FXAAShader) { const fx = new THREE.ShaderPass(THREE.FXAAShader); fx.uniforms.resolution.value.set(1 / (size.x * pr), 1 / (size.y * pr)); comp.addPass(fx); POST.fxaa = fx; }
    POST.composer = comp; POST.mode = lvl >= 2 ? "full" : "bloom";
  } catch (e) { console.warn("post-processing unavailable", e); POST.composer = null; }
}
function postResize() {
  if (!POST.composer) return; const r = E.renderer, size = r.getSize(new THREE.Vector2()), pr = r.getPixelRatio();
  POST.composer.setPixelRatio(pr); POST.composer.setSize(size.x, size.y);
  if (POST.fxaa) POST.fxaa.uniforms.resolution.value.set(1 / (size.x * pr), 1 / (size.y * pr));
}
function renderFrame() {
  if (POST.composer) {
    if (POST.grade) { const night = hourNow() >= 19 || hourNow() < 6; POST.grade.uniforms.uWarm.value = night ? -.02 : S.weather === "rain" ? 0 : .045; POST.grade.uniforms.uSat.value = S.weather === "rain" ? 1.0 : 1.1; }
    if (typeof toonGrade === "function") toonGrade();
    POST.composer.render();
  } else E.renderer.render(E.scene, E.camera);
}
