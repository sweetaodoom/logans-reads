/* Logan's Reads service worker — cache-first app shell (v1) */
const CACHE = "logans-reads-v3";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./data.js", "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "./audio/p_sam-cat_0.mp3",
  "./audio/p_sam-cat_1.mp3",
  "./audio/p_sam-cat_2.mp3",
  "./audio/p_sam-cat_3.mp3",
  "./audio/p_sea-fun_0.mp3",
  "./audio/p_sea-fun_1.mp3",
  "./audio/p_sea-fun_2.mp3",
  "./audio/p_sea-fun_3.mp3",
  "./audio/ph_a.mp3",
  "./audio/ph_b.mp3",
  "./audio/ph_c.mp3",
  "./audio/ph_d.mp3",
  "./audio/ph_e.mp3",
  "./audio/ph_f.mp3",
  "./audio/ph_g.mp3",
  "./audio/ph_h.mp3",
  "./audio/ph_i.mp3",
  "./audio/ph_j.mp3",
  "./audio/ph_l.mp3",
  "./audio/ph_m.mp3",
  "./audio/ph_n.mp3",
  "./audio/ph_o.mp3",
  "./audio/ph_p.mp3",
  "./audio/ph_r.mp3",
  "./audio/ph_s.mp3",
  "./audio/ph_t.mp3",
  "./audio/ph_u.mp3",
  "./audio/ph_w.mp3",
  "./audio/q_sam-cat.mp3",
  "./audio/q_sea-fun.mp3",
  "./audio/sen_0.mp3",
  "./audio/sen_1.mp3",
  "./audio/sen_2.mp3",
  "./audio/sen_3.mp3",
  "./audio/sen_4.mp3",
  "./audio/sen_5.mp3",
  "./audio/sen_6.mp3",
  "./audio/sen_7.mp3",
  "./audio/ui_awesome.mp3",
  "./audio/ui_didit.mp3",
  "./audio/ui_great.mp3",
  "./audio/ui_hi.mp3",
  "./audio/ui_locked.mp3",
  "./audio/ui_superstar.mp3",
  "./audio/ui_tryagain.mp3",
  "./audio/ui_yes.mp3",
  "./audio/w_a.mp3",
  "./audio/w_and.mp3",
  "./audio/w_bat.mp3",
  "./audio/w_big.mp3",
  "./audio/w_can.mp3",
  "./audio/w_cap.mp3",
  "./audio/w_cat.mp3",
  "./audio/w_dig.mp3",
  "./audio/w_digs.mp3",
  "./audio/w_dog.mp3",
  "./audio/w_fan.mp3",
  "./audio/w_fin.mp3",
  "./audio/w_fit.mp3",
  "./audio/w_fog.mp3",
  "./audio/w_fun.mp3",
  "./audio/w_has.mp3",
  "./audio/w_hat.mp3",
  "./audio/w_hit.mp3",
  "./audio/w_hop.mp3",
  "./audio/w_in.mp3",
  "./audio/w_is.mp3",
  "./audio/w_it.mp3",
  "./audio/w_jet.mp3",
  "./audio/w_log.mp3",
  "./audio/w_logan.mp3",
  "./audio/w_man.mp3",
  "./audio/w_map.mp3",
  "./audio/w_mat.mp3",
  "./audio/w_me.mp3",
  "./audio/w_mop.mp3",
  "./audio/w_my.mp3",
  "./audio/w_nap.mp3",
  "./audio/w_net.mp3",
  "./audio/w_on.mp3",
  "./audio/w_pan.mp3",
  "./audio/w_pat.mp3",
  "./audio/w_pet.mp3",
  "./audio/w_pig.mp3",
  "./audio/w_pin.mp3",
  "./audio/w_rat.mp3",
  "./audio/w_red.mp3",
  "./audio/w_run.mp3",
  "./audio/w_sam.mp3",
  "./audio/w_sand.mp3",
  "./audio/w_sat.mp3",
  "./audio/w_see.mp3",
  "./audio/w_sit.mp3",
  "./audio/w_sun.mp3",
  "./audio/w_tap.mp3",
  "./audio/w_the.mp3",
  "./audio/w_three.mp3",
  "./audio/w_top.mp3",
  "./audio/w_we.mp3",
  "./audio/w_win.mp3"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
