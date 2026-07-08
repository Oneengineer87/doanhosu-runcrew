// 목업 공통 스크립트: 모바일 메뉴 + 스크롤 등장 애니메이션
document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("burger");
  const m = document.getElementById("mnav");
  if (b && m) b.addEventListener("click", () => m.classList.toggle("open"));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".rise").forEach((el) => io.observe(el));
});
