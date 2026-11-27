

export function playAlerta(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC(); let active = true;
  const burst = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(740, t); o.frequency.linearRampToValueAtTime(900, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.36);
  };
  const loop = () => { if (!active) return; const n = ctx.currentTime; burst(n + 0.01); burst(n + 0.55); setTimeout(loop, 1800); };
  loop();
  return () => { active = false; ctx.close(); };
}

export function playGota(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC(); let active = true;
  const drop = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(1200, t); o.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.4);
  };
  const loop = () => { if (!active) return; const n = ctx.currentTime; drop(n + 0.01); drop(n + 0.6); drop(n + 1.1); setTimeout(loop, 2500); };
  loop();
  return () => { active = false; ctx.close(); };
}

export function playPop(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC(); let active = true;
  const pop = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.18);
    const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
    o2.type = "sine"; o2.frequency.setValueAtTime(1320, t + 0.2); o2.frequency.exponentialRampToValueAtTime(1600, t + 0.28);
    g2.gain.setValueAtTime(0.0001, t + 0.2); g2.gain.exponentialRampToValueAtTime(0.06, t + 0.21); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.2); o2.stop(t + 0.35);
  };
  const loop = () => { if (!active) return; const n = ctx.currentTime; pop(n + 0.01); setTimeout(loop, 3000); };
  loop();
  return () => { active = false; ctx.close(); };
}

export function iniciarSonido(sonidoId: string, sonidoData: string | null): { audio: HTMLAudioElement | null; stop: () => void } {
  if (sonidoId === "custom" && sonidoData) {
    const audio = new Audio(sonidoData); audio.loop = true;
    audio.play().catch(() => {});
    return { audio, stop: () => { audio.pause(); audio.currentTime = 0; } };
  }
  const stopFn = sonidoId === "gota" ? playGota() : sonidoId === "pop" ? playPop() : playAlerta();
  return { audio: null, stop: stopFn };
}

// ── Desbloquear AudioContext con primer toque ──────────────────
export let audioContextDesbloqueado = false;
export function desbloquearAudio() {
  if (audioContextDesbloqueado) return;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.connect(ctx.destination); src.start(0);
  setTimeout(() => ctx.close(), 100);
  audioContextDesbloqueado = true;
}
