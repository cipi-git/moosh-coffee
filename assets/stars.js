(function () {
  const c = document.getElementById('stars');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, stars;
  let angle = 0; // unghiul de rotație

  function resize() {
    w = c.width = innerWidth;
    h = c.height = innerHeight;
    create();
  }

  function create() {
    stars = new Array(Math.floor(w * h / 20000)).fill().map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4, // stele mai variate
      a: Math.random() * 0.6 + 0.6, // opacitate inițială
      t: Math.random() * Math.PI * 2,
      s: Math.random() * 0.015 + 0.005, // viteza twinkle
    }));
  }

  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Mutăm centrul la mijlocul ecranului și aplicăm rotația
    ctx.translate(w / 2, h / 2);
    ctx.rotate(angle);
    ctx.translate(-w / 2, -h / 2);

    // Desenăm fiecare stea
    for (const s of stars) {
      s.t += s.s;
      const tw = (Math.sin(s.t) + 1) * 0.5;
      ctx.globalAlpha = 0.15 + s.a * tw * 1.5;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // creștem unghiul (viteza de rotație)
    angle += 0.00025; // ajustează: 0.0001 = foarte lent, 0.001 = vizibil

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
