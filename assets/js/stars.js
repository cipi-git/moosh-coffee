document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height, stars;

  const init = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    stars = [];
    const numStars = Math.floor((width * height) / 6000); // Densitate dinamică

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5, // Mărime
        d: Math.random() * numStars, // Densitate
      });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.beginPath();
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    move();
  };

  const move = () => {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y -= 0.3; // Viteza de mișcare în sus
      if (s.y < 0) {
        s.y = height;
        s.x = Math.random() * width;
      }
    }
    requestAnimationFrame(draw);
  };

  window.addEventListener("resize", init);
  init();
  draw();
});
