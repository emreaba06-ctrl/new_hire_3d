/* =====================================================================
   TOON: stylized modern look. Ink outlines on characters and furniture,
   a soft rim light on characters, brighter fill light and richer color.
   Off on the Performance preset or when "Stylized look" is turned off.
   ===================================================================== */
const toonOn = () => S.gfx !== "perf" && S.toon !== false;
const OUTLINE_MATS = {};
function outlineMat(skinned, w) {
  const k = (skinned ? "s" : "m") + w; if (OUTLINE_MATS[k]) return OUTLINE_MATS[k];
  const m = new THREE.MeshBasicMaterial({ color: lin("#1f1a24"), side: THREE.BackSide, skinning: skinned });
  m.onBeforeCompile = sh => { sh.uniforms.uW = { value: w }; sh.vertexShader = "uniform float uW;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed += normalize(normal) * uW;"); };
  m.customProgramCacheKey = () => "outline" + k; m.userData.outline = true;
  return (OUTLINE_MATS[k] = m);
}
function addOutline(obj, rel = .018) {
  if (!toonOn() || !obj) return obj; const list = [];
  obj.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && !o.userData.outline && !o.userData.noOutline && o.geometry && o.geometry.attributes.normal) list.push(o); });
  for (const mesh of list) {
    const g = mesh.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
    const w = Math.round(clamp(g.boundingSphere.radius * rel, .002, 4) * 1000) / 1000;
    const om = outlineMat(!!mesh.isSkinnedMesh, w); let o;
    if (mesh.isSkinnedMesh) { o = new THREE.SkinnedMesh(g, om); o.bind(mesh.skeleton, mesh.bindMatrix); } else o = new THREE.Mesh(g, om);
    o.userData.outline = true; o.castShadow = o.receiveShadow = false; o.frustumCulled = mesh.frustumCulled; o.raycast = () => {};
    o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale);
    if (mesh.parent) mesh.parent.add(o);
  }
  return obj;
}
function rimify(obj) {
  if (!toonOn()) return obj;
  obj.traverse(o => { if (!o.isMesh || o.userData.outline) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach(m => { if (!m || m.userData.rim || !m.isMeshStandardMaterial) return; m.userData.rim = true;
      m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <dithering_fragment>", "float rimF = 1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += pow(rimF, 3.0) * 0.22 * vec3(1.0, 0.95, 0.88);\n#include <dithering_fragment>"); };
      m.customProgramCacheKey = () => "rim"; m.needsUpdate = true; }); });
  return obj;
}
{ // wrap character + furniture builders
  const mp = makePerson; makePerson = function (look) { const r = mp(look); if (r && r.userData && r.userData.model) { rimify(r); addOutline(r, .012); } return r; };
  const mm = makeModular; makeModular = function (look) { const r = mm(look); if (r) { rimify(r); addOutline(r, .012); } return r; };
  const fm = PROP.fm; PROP.fm = function (name, x, z, ry, o = {}) { const g = fm.call(PROP, name, x, z, ry, o); if (g && !/Carpet|Curtain|Light_/.test(name)) addOutline(g, .02); return g; };
}
/* brighter, softer fill light and a richer grade */
{ const sl = setLighting; setLighting = function (h, w) { sl(h, w); if (!toonOn() || !E.hemi) return; E.hemi.intensity *= 1.45; if (E.sun) E.sun.intensity *= .92; }; }
function toonGrade() { if (!POST.grade || !toonOn()) return; const u = POST.grade.uniforms; u.uContrast.value = 1.1; u.uSat.value = Math.max(u.uSat.value, 1.2); u.uVig.value = .26; }
