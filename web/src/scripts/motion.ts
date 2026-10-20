// Animacje przewijania (GSAP + ScrollTrigger). Wszystko wyłącza się przy prefers-reduced-motion.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => window.matchMedia('(max-width: 900px)').matches;

export function initMotion() {
  if (reduce) { document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')); return; }
  gsap.registerPlugin(ScrollTrigger);

  // wejścia sekcji
  gsap.utils.toArray<HTMLElement>('.reveal').forEach(el => {
    gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });


  // hero: telefon unosi się, przy przewijaniu odpływa wolniej niż tło
  const heroPhone = document.querySelector<HTMLElement>('.hero .ph');
  if (heroPhone) {
    gsap.to(heroPhone, { y: -10, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(heroPhone, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.hero .toast', { x: 40, autoAlpha: 0, duration: .8, delay: .6, ease: 'power3.out' });
  }

  // zigzag funkcji: telefon wjeżdża z boku i prostuje się, tekst dogania
  gsap.utils.toArray<HTMLElement>('.feat .row').forEach(row => {
    const flip = row.classList.contains('flip'); const ph = row.querySelector('.ph'); const copy = row.querySelector('.copy');
    if (!ph) return;
    const m = mobile();
    gsap.fromTo(ph, { x: m ? 0 : (flip ? 120 : -120), y: m ? 32 : 0, rotate: m ? 0 : (flip ? 8 : -8), autoAlpha: 0 }, { x: 0, y: 0, rotate: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: row, start: 'top 85%', end: 'top 35%', scrub: .6 } });
    if (copy) gsap.fromTo(copy, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: row, start: 'top 80%', end: 'top 45%', scrub: .6 } });
    gsap.to(ph, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  // wyróżnik: trzy telefony rozkładają się jak wachlarz
  const fan = document.querySelector<HTMLElement>('.hl .phones');
  if (fan && !mobile()) {
    const [p1, p2, p3] = ['.p1', '.p2', '.p3'].map(s => fan.querySelector<HTMLElement>(s));
    const tl = gsap.timeline({ scrollTrigger: { trigger: fan, start: 'top 90%', end: 'top 30%', scrub: .8 } });
    if (p1) tl.fromTo(p1, { x: 200, rotate: 0, autoAlpha: 0 }, { x: 0, rotate: -4, autoAlpha: 1 }, 0);
    if (p3) tl.fromTo(p3, { x: -200, rotate: 0, autoAlpha: 0 }, { x: 0, rotate: 4, autoAlpha: 1 }, 0);
    if (p2) tl.fromTo(p2, { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, 0);
  }

  // galeria: pasek przesuwa się wraz z przewijaniem (podpowiedź, że da się przewinąć w bok)
  const strip = document.querySelector<HTMLElement>('.gal .strip');
  if (strip && !mobile()) gsap.fromTo(strip, { x: 80 }, { x: -120, ease: 'none', scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: 1 } });

  // tour ekranów: przypięty telefon, ekrany zmieniają się wraz z krokami po lewej
  const tour = document.querySelector<HTMLElement>('.tour');
  if (tour) {
    const screens = tour.querySelectorAll<HTMLElement>('.tour-screen');
    const steps = tour.querySelectorAll<HTMLElement>('.tour-step');
    const pin = tour.querySelector<HTMLElement>('.tour-pin');
    const show = (i: number) => {
      screens.forEach((s, k) => gsap.to(s, { autoAlpha: k === i ? 1 : 0, y: k === i ? 0 : (k < i ? -30 : 30), scale: k === i ? 1 : .96, duration: .55, ease: 'power2.out', overwrite: true }));
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
    };
    show(0);
    if (!mobile() && pin) {
      ScrollTrigger.create({ trigger: tour.querySelector('.tour-steps'), start: 'top 96px', end: 'bottom bottom', pin: pin, pinSpacing: false });
      steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top center', end: 'bottom center', onEnter: () => show(i), onEnterBack: () => show(i) }));
    } else {
      steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 70%', onEnter: () => show(i), onEnterBack: () => show(i) }));
    }
  }

  // cennik: karta PRO lekko unosi się przy wejściu
  const pro = document.querySelector('.pr .pro');
  if (pro) gsap.from(pro, { y: 40, scale: .98, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: pro, start: 'top 85%', once: true } });
}
initMotion();
