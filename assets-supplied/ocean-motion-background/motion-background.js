(() => {
  const scene = document.querySelector("[data-ambient-background]");
  if (!scene) return;

  const video = scene.querySelector("video");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const connection = navigator.connection;

  const settings = {
    pointerX: 0.03,
    pointerY: 0.022,
    scrollTravel: 0.06,
    rotation: 0.16,
    easing: 0.085,
  };

  const target = { x: 0, y: 0, scrollY: 0, rotation: 0 };
  const current = { ...target };
  let animationFrame = 0;

  const saveDataEnabled = () => connection?.saveData === true;
  const motionAllowed = () => !reducedMotion.matches && !saveDataEnabled();

  function scheduleFrame() {
    if (!animationFrame) animationFrame = requestAnimationFrame(render);
  }

  function render() {
    animationFrame = 0;

    current.x += (target.x - current.x) * settings.easing;
    current.y += (target.y - current.y) * settings.easing;
    current.scrollY +=
      (target.scrollY - current.scrollY) * settings.easing;
    current.rotation +=
      (target.rotation - current.rotation) * settings.easing;

    scene.style.setProperty("--motion-x", `${current.x.toFixed(2)}px`);
    scene.style.setProperty("--motion-y", `${current.y.toFixed(2)}px`);
    scene.style.setProperty("--scroll-y", `${current.scrollY.toFixed(2)}px`);
    scene.style.setProperty(
      "--motion-rotate",
      `${current.rotation.toFixed(3)}deg`,
    );

    const stillMoving = Object.keys(target).some(
      (key) => Math.abs(target[key] - current[key]) > 0.08,
    );

    if (stillMoving) scheduleFrame();
  }

  function resetPointer() {
    target.x = 0;
    target.y = 0;
    target.rotation = 0;
    scheduleFrame();
  }

  function onPointerMove(event) {
    if (!motionAllowed() || !finePointer.matches) return;

    const normalizedX = event.clientX / window.innerWidth - 0.5;
    const normalizedY = event.clientY / window.innerHeight - 0.5;

    target.x = -normalizedX * window.innerWidth * settings.pointerX;
    target.y = -normalizedY * window.innerHeight * settings.pointerY;
    target.rotation = normalizedX * settings.rotation;
    scheduleFrame();
  }

  function onScroll() {
    if (!motionAllowed()) {
      target.scrollY = 0;
      scheduleFrame();
      return;
    }

    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

    target.scrollY =
      (progress - 0.5) * window.innerHeight * settings.scrollTravel;
    scheduleFrame();
  }

  async function syncMotionMode() {
    const staticMode = !motionAllowed();
    scene.classList.toggle("is-static", staticMode);

    if (staticMode || document.hidden) {
      video?.pause();
      resetPointer();
      target.scrollY = 0;
      scheduleFrame();
      return;
    }

    try {
      await video?.play();
      scene.classList.remove("is-static");
    } catch {
      scene.classList.add("is-static");
    }
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("blur", resetPointer);
  document.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) resetPointer();
  });
  document.addEventListener("visibilitychange", syncMotionMode);
  video?.addEventListener("error", () => scene.classList.add("is-static"));

  const addMediaListener = (query, listener) => {
    if (query.addEventListener) query.addEventListener("change", listener);
    else query.addListener(listener);
  };

  addMediaListener(reducedMotion, syncMotionMode);
  addMediaListener(finePointer, resetPointer);
  connection?.addEventListener?.("change", syncMotionMode);

  onScroll();
  syncMotionMode();
})();
